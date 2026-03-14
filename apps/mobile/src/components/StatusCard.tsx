import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';

interface StatusCardProps {
  label: string;
  detail: string;
  toneColor: string;
  progress?: number;
  stream?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  label,
  detail,
  toneColor,
  progress,
  stream = false,
}) => {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const [visibleDetail, setVisibleDetail] = useState(detail);
  const sourceTextRef = useRef('');
  const visibleWordsRef = useRef<string[]>([]);
  const queuedWordsRef = useRef<string[]>([]);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const nextDetail = String(detail || '').trim();

    const clearStreamTimer = () => {
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };

    const flushQueue = () => {
      if (queuedWordsRef.current.length === 0) {
        streamTimerRef.current = null;
        return;
      }

      visibleWordsRef.current = [...visibleWordsRef.current, queuedWordsRef.current.shift() as string];
      setVisibleDetail(visibleWordsRef.current.join(' '));

      if (queuedWordsRef.current.length === 0) {
        streamTimerRef.current = null;
        return;
      }

      const delay = queuedWordsRef.current.length > 10 ? 112 : 164;
      streamTimerRef.current = setTimeout(flushQueue, delay);
    };

    if (!stream || !nextDetail) {
      clearStreamTimer();
      sourceTextRef.current = nextDetail;
      visibleWordsRef.current = nextDetail ? nextDetail.split(/\s+/).filter(Boolean) : [];
      queuedWordsRef.current = [];
      setVisibleDetail(nextDetail);
      return;
    }

    if (!nextDetail.startsWith(sourceTextRef.current)) {
      clearStreamTimer();
      sourceTextRef.current = '';
      visibleWordsRef.current = [];
      queuedWordsRef.current = [];
      setVisibleDetail('');
    }

    const nextWords = nextDetail.split(/\s+/).filter(Boolean);
    const knownWordCount = visibleWordsRef.current.length + queuedWordsRef.current.length;
    const appendedWords = nextWords.slice(knownWordCount);

    sourceTextRef.current = nextDetail;

    if (appendedWords.length > 0) {
      queuedWordsRef.current = [...queuedWordsRef.current, ...appendedWords];
      if (!streamTimerRef.current) {
        flushQueue();
      }
      return;
    }

    if (visibleWordsRef.current.length === 0 && nextWords.length > 0) {
      visibleWordsRef.current = nextWords;
      setVisibleDetail(nextWords.join(' '));
      return;
    }

    setVisibleDetail(visibleWordsRef.current.join(' '));
  }, [detail, stream]);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.header, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, { color: toneColor }]}>
          {label}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text selectable style={[styles.statusCopy, { color: theme.text }]}>
          {visibleDetail}
        </Text>
        
        {typeof progress === 'number' && progress > 0 && progress < 100 && (
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBar, { backgroundColor: toneColor, width: `${progress}%` }]} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  header: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fonts.mono,
    letterSpacing: 2,
  },
  content: {
    padding: Spacing.lg,
    minHeight: 100,
    justifyContent: 'center',
  },
  statusCopy: {
    fontSize: Typography.sizes.md,
    lineHeight: 24,
    fontFamily: Typography.fonts.regular,
  },
  progressBarBg: {
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressBar: {
    height: '100%',
  },
});
