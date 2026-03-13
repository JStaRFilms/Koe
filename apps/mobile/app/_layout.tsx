import { Tabs } from 'expo-router';
import { Text, useColorScheme } from 'react-native';
import { Colors } from '../src/constants/Theme';

export default function RootLayout() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          color: theme.text,
          fontWeight: '700',
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: theme.background,
        },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Koe',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>Rec</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>Log</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 14 }}>Cfg</Text>,
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          headerShown: false,
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
