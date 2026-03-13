import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Spacing } from '../constants/Theme';

interface StatusCardProps {
  label: string;
  detail: string;
  toneColor: string;
  progress?: number;
  theme: any;
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, detail, toneColor, progress, theme }) => {
  return (
    <View style={[styles.statusCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text style={[styles.statusLabel, { color: toneColor }]}>
        {label}
      </Text>
      <Text selectable style={[styles.statusCopy, { color: theme.text }]}>
        {detail}
      </Text>
      {typeof progress === 'number' && progress > 0 && progress < 100 && (
        <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
          <View style={[styles.progressBar, { backgroundColor: toneColor, width: `${progress}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  statusCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusCopy: {
    fontSize: 16,
    lineHeight: 24,
  },
  progressBarBg: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
