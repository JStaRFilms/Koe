import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';

interface StatusCardProps {
  label: string;
  detail: string;
  toneColor: string;
  progress?: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ 
  label, 
  detail, 
  toneColor, 
  progress,
}) => {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.header, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, { color: toneColor }]}>
          {label}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text selectable style={[styles.statusCopy, { color: theme.text }]}>
          {detail}
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
