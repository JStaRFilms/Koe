import { useState } from 'react';
import { Text, View, StyleSheet, useColorScheme, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Colors, Spacing } from '../src/constants/Theme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const [enhancementEnabled, setEnhancementEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const SettingItem = ({ marker, label, value, onPress, onValueChange, type = 'link' }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.settingItem, { borderBottomColor: theme.border }]}
    >
      <View style={styles.settingLabelContainer}>
        <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.iconMarker, { color: theme.accent }]}>{marker}</Text>
        </View>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      </View>
      
      <View style={styles.settingValueContainer}>
        {type === 'link' && (
          <>
            <Text style={[styles.settingValue, { color: theme.textMuted }]}>{value}</Text>
            <Text style={[styles.chevron, { color: theme.textDim }]}>›</Text>
          </>
        )}
        {type === 'switch' && (
          <Switch 
            value={value} 
            onValueChange={onValueChange}
            trackColor={{ false: theme.surface, true: theme.accentDim }}
            thumbColor={value ? theme.accent : theme.textDim}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.summaryCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>Mobile defaults are scaffolded</Text>
          <Text selectable style={[styles.summaryBody, { color: theme.textMuted }]}>
            API key storage, language selection, and polish toggles are laid out here without binding to persistence yet.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>AI CONFIGURATION</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <SettingItem marker="K" label="Groq API Key" value="Required" />
            <SettingItem marker="L" label="Language" value="Automatic" />
            <SettingItem
              marker="AI"
              label="AI Enhancement"
              value={enhancementEnabled}
              onValueChange={setEnhancementEnabled}
              type="switch"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>APP SETTINGS</Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <SettingItem marker="A" label="App Icon" />
            <SettingItem
              marker="H"
              label="Haptic Feedback"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              type="switch"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.textDim }]}>Koe Mobile v1.0.0</Text>
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
    gap: Spacing.lg,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconMarker: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 15,
    marginRight: Spacing.xs,
  },
  chevron: {
    fontSize: 18,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
