export interface MobileReleaseTarget {
  url: string;
  label: string;
  description: string;
}

function readPublicEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

const iosUrl = readPublicEnv("NEXT_PUBLIC_KOE_IOS_URL");
const androidUrl = readPublicEnv("NEXT_PUBLIC_KOE_ANDROID_URL");

export function getIosReleaseTarget(): MobileReleaseTarget | null {
  if (!iosUrl) {
    return null;
  }

  return {
    url: iosUrl,
    label: "iPhone beta",
    description: "Install the latest iOS build",
  };
}

export function getAndroidReleaseTarget(): MobileReleaseTarget | null {
  if (!androidUrl) {
    return null;
  }

  return {
    url: androidUrl,
    label: "Android build",
    description: "Install the latest Android build",
  };
}
