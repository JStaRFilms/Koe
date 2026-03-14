import { Text, View, StyleSheet, useColorScheme, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../src/constants/Theme';
import { loadAppSettings, saveAppSettings } from '../src/storage/settings-storage';
import { GridBackground } from '../src/components/GridBackground';
import { ScanlineOverlay } from '../src/components/ScanlineOverlay';
import { BrutalButton } from '../src/components/BrutalButton';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const router = useRouter();

  const handleFinish = async () => {
    const settings = await loadAppSettings();
    await saveAppSettings({ ...settings, hasSeenOnboarding: true });
    router.replace('/');
  };

  return (
    <View style={styles.outer}>
      <GridBackground />
      <ScanlineOverlay />

      <View style={styles.kanjiContainer} pointerEvents="none">
        <Text style={[styles.kanji, { color: theme.border, opacity: 0.15 }]}>{'\u58F0'}</Text>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.hero}>
            <View style={[styles.badge, { borderColor: theme.border }]}>
              <Text style={[styles.badgeText, { color: theme.textMuted }]}>First run</Text>
            </View>
            <Text style={[styles.title, { color: theme.text, fontFamily: Typography.fonts.deco }]}>
              Koe <Text style={{ color: theme.accent }}>{'\u58F0'}</Text>
            </Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Speak, polish, paste.
            </Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={[styles.infoBlock, { borderColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Add your key</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>
                Koe uses your own API key to process audio. No subscriptions required.
              </Text>
            </View>

            <View style={[styles.infoBlock, { borderColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Voice to Clipboard</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>
                Record, stop, and your refined text is ready to paste anywhere.
              </Text>
            </View>

            <View style={[styles.infoBlock, { borderColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Always Resilient</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>
                Koe saves your last session if a connection drops. Never lose a thought.
              </Text>
            </View>
          </View>

          <Text style={[styles.helpText, { color: theme.textDim }]}>
            Configure your own API key in Settings to begin.
          </Text>
        </View>

        <View style={styles.footer}>
          <BrutalButton onPress={handleFinish} title="Open Koe" style={{ width: '100%' }} />
          <Text style={[styles.footerNote, { color: theme.textDim }]}>Ready when you are</Text>
        </View>
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
  kanji: { fontSize: width * 1.2 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 80,
    justifyContent: 'center',
    gap: 40,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontSize: Typography.sizes.sm, letterSpacing: 1, textAlign: 'center' },
  cardContainer: { gap: Spacing.lg },
  infoBlock: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  infoTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  infoDesc: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  helpText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.xl,
    paddingBottom: 60,
    gap: Spacing.md,
    alignItems: 'center',
  },
  footerNote: { fontSize: Typography.sizes.xs },
});
