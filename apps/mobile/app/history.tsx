import { useCallback, useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  useColorScheme, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing } from '../src/constants/Theme';
import { loadHistory, clearHistory, type HistoryItem } from '../src/storage/history-storage';

export default function HistoryScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    Alert.alert('Copied', 'Transcript copied to clipboard.');
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all recent transcriptions?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive', 
          onPress: async () => {
            await clearHistory();
            setHistory([]);
          } 
        },
      ]
    );
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.eyebrow, { color: theme.textMuted }]}>Recent output</Text>
          {history.length > 0 && (
            <TouchableOpacity onPress={handleClearHistory}>
              <Text style={[styles.clearText, { color: theme.danger }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyGlyph, { color: theme.textDim }]}>◷</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No transcriptions yet</Text>
            <Text selectable style={[styles.emptyHint, { color: theme.textDim }]}>
              Completed transcripts will land here with timestamps, raw/refined text, and quick copy actions.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {history.map((item) => (
              <View 
                key={item.id} 
                style={[styles.itemCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              >
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemDate, { color: theme.textMuted }]}>
                    {formatDate(item.timestamp)} • {formatTime(item.timestamp)}
                  </Text>
                  <Text style={[styles.itemDuration, { color: theme.textDim }]}>
                    {Math.round(item.durationMillis / 1000)}s
                  </Text>
                </View>
                
                <Text selectable style={[styles.itemText, { color: theme.text }]}>
                  {item.refinedText || item.rawText}
                </Text>
                {item.refinedText && item.refinedText !== item.rawText && (
                  <Text selectable style={[styles.rawText, { color: theme.textDim }]}>
                    Raw: {item.rawText}
                  </Text>
                )}

                <TouchableOpacity 
                  onPress={() => handleCopy(item.refinedText || item.rawText)}
                  style={[styles.copyButton, { borderColor: theme.border }]}
                >
                  <Text style={[styles.copyButtonText, { color: theme.accent }]}>Copy again</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
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
  list: {
    gap: Spacing.md,
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemDuration: {
    fontSize: 12,
  },
  itemText: {
    fontSize: 15,
    lineHeight: 22,
  },
  rawText: {
    fontSize: 13,
    lineHeight: 18,
  },
  copyButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
