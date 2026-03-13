import { Text, View, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';

export default function HistoryScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.summaryCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Recent output</Text>
        <Text selectable style={[styles.summaryText, { color: theme.text }]}>
          History is scaffolded for Task 5. This shell already reserves empty, recent, and copy-focused layouts.
        </Text>
      </View>

      <View style={styles.emptyContainer}>
          <Text style={[styles.emptyGlyph, { color: theme.textDim }]}>◷</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No transcriptions yet</Text>
          <Text selectable style={[styles.emptyHint, { color: theme.textDim }]}>
            Completed transcripts will land here with timestamps, raw/refined text, and quick copy actions.
          </Text>
        </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyContainer: {
    fontWeight: '700',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyGlyph: {
    fontSize: 42,
    lineHeight: 46,
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
