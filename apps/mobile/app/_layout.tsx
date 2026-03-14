import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Mic, List, Settings } from 'lucide-react-native';
import { Colors } from '../src/constants/Theme';
import { loadAppSettings } from '../src/storage/settings-storage';

export default function RootLayout() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const settings = await loadAppSettings();
      if (!settings.hasSeenOnboarding && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
      setIsReady(true);
    };
    void checkOnboarding();
  }, [segments]);

  if (!isReady) return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          color: theme.text,
          fontWeight: '700',
          fontFamily: 'System', // Will use deco handle later
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        sceneStyle: {
          backgroundColor: theme.background,
        },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: 70,
          paddingTop: 12,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textDim,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Koe',
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <List color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}

