import { Text, View, StyleSheet, useColorScheme, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography } from '../src/constants/Theme';
import { loadAppSettings, saveAppSettings } from '../src/storage/settings-storage';
import { GridBackground } from '../src/components/GridBackground';
import { ScanlineOverlay } from '../src/components/ScanlineOverlay';
import { BrutalButton } from '../src/components/BrutalButton';
import { AccountAuthCard } from '../src/components/AccountAuthCard';

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
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Speak, polish, paste.</Text>
          </View>

          <View style={styles.cardContainer}>
            <View style={[styles.infoBlock, { borderColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Sign in once</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>Use the same account on mobile and desktop.</Text>
            </View>

            <View style={[styles.infoBlock, { borderColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Managed or BYOK</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>Pick Koe-managed mode or save your own Groq key to your account vault.</Text>
            </View>

            <View style={[styles.infoBlock, { borderColor: theme.border }]}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Offline fallback</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>You can still keep a device-only Groq key later in Settings for legacy fallback.</Text>
            </View>
          </View>

          <AccountAuthCard
            headerTitle="Account // Optional"
            initialMode="signup"
            helperText="Create an account to use managed mode without a local Groq key. You can also skip this and continue with local fallback later."
            onAuthenticated={handleFinish}
          />

          <Text style={[styles.helpText, { color: theme.textDim }]}>You can always sign in later from Settings.</Text>
        </View>

        <View style={styles.footer}>
          <BrutalButton onPress={() => void handleFinish()} title="Continue to Koe" style={{ width: '100%' }} />
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
    gap: 32,
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
