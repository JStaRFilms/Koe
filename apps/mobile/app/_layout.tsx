import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, useColorScheme } from 'react-native';
import { Mic, List, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Theme';
import { loadAppSettings } from '../src/storage/settings-storage';
import {
  checkForAndroidUpdate,
  downloadAndInstallAndroidUpdate,
  getAndroidUpdateErrorMessage,
  skipAndroidUpdateVersion,
} from '../src/updates/android-updates';

export default function RootLayout() {
  const colorScheme = useColorScheme() || 'dark';
  const theme = Colors[colorScheme as keyof typeof Colors];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const updatePromptShownRef = useRef(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const settings = await loadAppSettings();
      setHasSeenOnboarding(settings.hasSeenOnboarding);
      if (!settings.hasSeenOnboarding && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
      setIsReady(true);
    };
    void checkOnboarding();
  }, [segments, router]);

  useEffect(() => {
    if (!isReady || !hasSeenOnboarding || Platform.OS !== 'android' || segments[0] === 'onboarding' || updatePromptShownRef.current) {
      return;
    }

    updatePromptShownRef.current = true;
    let isMounted = true;

    const checkUpdates = async () => {
      const result = await checkForAndroidUpdate({ respectSkipped: true });

      if (!isMounted || result.status !== 'available') {
        return;
      }

      Alert.alert(
        'Koe update available',
        `Version ${result.update.versionName} is ready. Download the APK from GitHub and open the Android installer?`,
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => {
              void skipAndroidUpdateVersion(result.update.versionName);
            },
          },
          {
            text: 'Download & install',
            onPress: () => {
              void downloadAndInstallAndroidUpdate(result.update).catch((error) => {
                Alert.alert('Update failed', getAndroidUpdateErrorMessage(error));
              });
            },
          },
        ]
      );
    };

    void checkUpdates();

    return () => {
      isMounted = false;
    };
  }, [hasSeenOnboarding, isReady, segments]);

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
          height: 58 + Math.max(insets.bottom, 10),
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textDim,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
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
