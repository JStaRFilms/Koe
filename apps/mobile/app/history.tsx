import { useCallback, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '../src/constants/Theme';
import { loadHistory, clearHistory, type HistoryItem } from '../src/storage/history-storage';
import { GridBackground } from '../src/components/GridBackground';
import { ScanlineOverlay } from '../src/components/ScanlineOverlay';
import { BrutalCard } from '../src/components/BrutalCard';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showRawOverrides, setShowRawOverrides] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        const items = await loadHistory();
        if (!cancelled) {
          setHistory(items);
        }
      };

      void load();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const toggleRaw = (id: string) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics are optional.
    }

    setShowRawOverrides((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics are optional.
    }
    Alert.alert('Copied', 'The selected text is in your clipboard.');
  };

  const handleClearHistory = () => {
    Alert.alert('Clear history', 'Delete all saved transcripts from this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setHistory([]);
        },
      },
    ]);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
      .getDate()
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <View style={styles.outer}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.kanjiContainer} pointerEvents="none">
        <Text style={[styles.kanji, { color: theme.border, opacity: 0.1 }]}>{'\u58F0'}</Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text, fontFamily: Typography.fonts.deco }]}>
              History
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Recent voice notes</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity
              onPress={handleClearHistory}
              style={[
                styles.purgeBtn,
                {
                  borderColor: theme.danger,
                  backgroundColor: theme.dangerDim,
                },
              ]}
            >
              <Trash2 size={16} color={theme.danger} />
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyGlyph, { color: theme.border }]}>{'\u58F0'}</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Your recent recordings will show up here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {history.map((item) => {
              const isRaw = showRawOverrides[item.id] ?? false;
              const hasRefined = !!item.refinedText && item.refinedText !== item.rawText;
              const displayText = isRaw ? item.rawText : item.refinedText || item.rawText;

              return (
                <BrutalCard key={item.id} headerTitle={`${formatDate(item.timestamp)} // ${formatTime(item.timestamp)}`}>
                  <View style={styles.itemBody}>
                    <Text selectable style={[styles.itemText, { color: theme.text }]}>
                      {displayText}
                    </Text>

                    <View style={[styles.itemFooter, { borderTopColor: theme.border }]}>
                      <View style={styles.itemMeta}>
                        <Text style={[styles.metaText, { color: theme.textDim }]}>
                          {Math.round(item.durationMillis / 1000)} sec
                        </Text>
                      </View>

                      <View style={styles.actions}>
                        {hasRefined && (
                          <TouchableOpacity
                            onPress={() => toggleRaw(item.id)}
                            style={[styles.miniAction, { borderColor: theme.border }]}
                          >
                            {isRaw ? (
                              <Eye size={14} color={theme.accent} />
                            ) : (
                              <EyeOff size={14} color={theme.textDim} />
                            )}
                            <Text style={[styles.miniActionText, { color: isRaw ? theme.accent : theme.textDim }]}>
                              {isRaw ? 'Show polished' : 'Show original'}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleCopy(displayText)}
                          style={[styles.miniAction, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
                        >
                          <Copy size={14} color={theme.accent} />
                          <Text style={[styles.miniActionText, { color: theme.text }]}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </BrutalCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  container: { flex: 1 },
  kanjiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kanji: { fontSize: width * 0.8 },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: Typography.sizes.xl, fontWeight: '800' },
  subtitle: { fontSize: Typography.sizes.xs },
  purgeBtn: {
    borderWidth: 1,
    padding: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyGlyph: { fontSize: 80, opacity: 0.2 },
  emptyText: { fontSize: Typography.sizes.sm, marginTop: Spacing.lg },
  list: { gap: Spacing.md },
  itemBody: { gap: Spacing.md },
  itemText: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
    fontFamily: Typography.fonts.regular,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  itemMeta: { flexDirection: 'row' },
  metaText: { fontSize: 9, fontWeight: '700', fontFamily: Typography.fonts.mono },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  miniActionText: { fontSize: 9, fontWeight: '700', fontFamily: Typography.fonts.mono },
});
