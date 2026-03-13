import { Text, View, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const router = useRouter();

  const Step = ({ marker, title, description }: { marker: string; title: string; description: string }) => (
    <View style={styles.step}>
      <View style={[styles.iconBox, { backgroundColor: theme.accentDim }]}>
        <Text style={[styles.iconMarker, { color: theme.accent }]}>{marker}</Text>
      </View>
      <View style={styles.stepText}>
        <Text style={[styles.stepTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.stepDesc, { color: theme.textMuted }]}>{description}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome to Koe</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Voice dictation that works for you.</Text>
        </View>

        <View style={styles.steps}>
          <Step 
            marker="1" 
            title="Press to Speak" 
            description="Tap the mic button and start talking. We'll handle the rest."
          />
          <Step 
            marker="2" 
            title="Instant Copied" 
            description="Your text is automatically copied to your clipboard as soon as you stop."
          />
          <Step 
            marker="3" 
            title="AI Enhanced" 
            description="Whisper + Llama ensure your text is perfect and ready to use."
          />
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={() => router.replace('/')}
          style={[styles.button, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.buttonText, { color: theme.background }]}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  steps: {
    gap: Spacing.xl,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  iconMarker: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    padding: Spacing.xl,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
