import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform } from 'react-native';

const DEFAULT_GITHUB_OWNER = 'JStaRFilms';
const DEFAULT_GITHUB_REPO = 'Koe';
const APK_MIME_TYPE = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 1;
const SKIPPED_ANDROID_UPDATE_KEY = 'koe_android_skipped_update_version_v1';

export interface AndroidUpdateInfo {
  versionName: string;
  versionCode?: number;
  apkUrl: string;
  releaseUrl?: string;
  releaseNotes?: string;
  assetName?: string;
  assetSize?: number;
  publishedAt?: string;
}

export type AndroidUpdateCheckResult =
  | { status: 'unsupported'; reason: string }
  | { status: 'up-to-date'; currentVersionName: string; currentVersionCode?: number }
  | { status: 'skipped'; update: AndroidUpdateInfo }
  | { status: 'available'; update: AndroidUpdateInfo }
  | { status: 'error'; message: string };

interface UpdateManifest {
  versionName?: string;
  version?: string;
  versionCode?: number;
  apkUrl?: string;
  url?: string;
  releaseUrl?: string;
  releaseNotes?: string;
  notes?: string;
  assetName?: string;
  assetSize?: number;
  publishedAt?: string;
}

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  content_type?: string;
  size?: number;
}

interface GitHubRelease {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  assets?: GitHubReleaseAsset[];
}

interface CheckOptions {
  respectSkipped?: boolean;
}

function getExtraString(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const value = extra?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getCurrentVersionName() {
  const constantsWithNativeVersion = Constants as typeof Constants & { nativeAppVersion?: string | null };
  return Constants.expoConfig?.version ?? constantsWithNativeVersion.nativeAppVersion ?? '0.0.0';
}

function getCurrentVersionCode() {
  const constantsWithNativeBuild = Constants as typeof Constants & { nativeBuildVersion?: string | null };
  const nativeBuildVersion = constantsWithNativeBuild.nativeBuildVersion;
  const parsedNativeBuildVersion = nativeBuildVersion ? Number(nativeBuildVersion) : undefined;

  if (Number.isFinite(parsedNativeBuildVersion)) {
    return parsedNativeBuildVersion;
  }

  const manifestVersionCode = Constants.manifest?.android?.versionCode;
  if (Number.isFinite(manifestVersionCode)) {
    return manifestVersionCode;
  }

  return Constants.expoConfig?.android?.versionCode;
}

export function getCurrentAndroidAppVersionLabel() {
  const versionName = getCurrentVersionName();
  const versionCode = getCurrentVersionCode();
  return versionCode ? `${versionName} (${versionCode})` : versionName;
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, '');
}

function parseVersionParts(value: string) {
  return normalizeVersion(value)
    .split(/[.+\-_]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function compareVersions(nextVersion: string, currentVersion: string) {
  const nextParts = parseVersionParts(nextVersion);
  const currentParts = parseVersionParts(currentVersion);
  const length = Math.max(nextParts.length, currentParts.length);

  for (let index = 0; index < length; index += 1) {
    const nextPart = nextParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;

    if (nextPart > currentPart) {
      return 1;
    }

    if (nextPart < currentPart) {
      return -1;
    }
  }

  return 0;
}

function isUpdateNewer(update: AndroidUpdateInfo) {
  const currentVersionCode = getCurrentVersionCode();
  if (update.versionCode && currentVersionCode && update.versionCode > currentVersionCode) {
    return true;
  }

  return compareVersions(update.versionName, getCurrentVersionName()) > 0;
}

function pickAndroidApkAsset(assets: GitHubReleaseAsset[]) {
  const apkAssets = assets.filter((asset) => {
    const name = asset.name.toLowerCase();
    return name.endsWith('.apk') || asset.content_type === APK_MIME_TYPE;
  });

  return apkAssets.find((asset) => /koe|mobile|android/i.test(asset.name)) ?? apkAssets[0] ?? null;
}

function normalizeManifest(manifest: UpdateManifest): AndroidUpdateInfo | null {
  const versionName = manifest.versionName ?? manifest.version;
  const apkUrl = manifest.apkUrl ?? manifest.url;

  if (!versionName || !apkUrl) {
    return null;
  }

  return {
    versionName: normalizeVersion(versionName),
    versionCode: manifest.versionCode,
    apkUrl,
    releaseUrl: manifest.releaseUrl,
    releaseNotes: manifest.releaseNotes ?? manifest.notes,
    assetName: manifest.assetName,
    assetSize: manifest.assetSize,
    publishedAt: manifest.publishedAt,
  };
}

function normalizeGitHubRelease(release: GitHubRelease): AndroidUpdateInfo | null {
  const asset = pickAndroidApkAsset(release.assets ?? []);
  const versionName = release.tag_name ? normalizeVersion(release.tag_name) : undefined;

  if (!asset || !versionName) {
    return null;
  }

  return {
    versionName,
    apkUrl: asset.browser_download_url,
    releaseUrl: release.html_url,
    releaseNotes: release.body,
    assetName: asset.name,
    assetSize: asset.size,
    publishedAt: release.published_at,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Koe-Client': 'android-updater',
    },
  });

  if (!response.ok) {
    throw new Error(`Update check failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function fetchLatestAndroidUpdate() {
  const manifestUrl = process.env.EXPO_PUBLIC_KOE_ANDROID_UPDATE_MANIFEST_URL ?? getExtraString('androidUpdateManifestUrl');

  if (manifestUrl) {
    return normalizeManifest(await fetchJson<UpdateManifest>(manifestUrl));
  }

  const owner = process.env.EXPO_PUBLIC_KOE_ANDROID_GITHUB_OWNER ?? getExtraString('androidUpdateGithubOwner') ?? DEFAULT_GITHUB_OWNER;
  const repo = process.env.EXPO_PUBLIC_KOE_ANDROID_GITHUB_REPO ?? getExtraString('androidUpdateGithubRepo') ?? DEFAULT_GITHUB_REPO;
  const releases = await fetchJson<GitHubRelease[]>(`https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`);

  for (const release of releases) {
    if (release.draft) {
      continue;
    }

    const update = normalizeGitHubRelease(release);
    if (update) {
      return update;
    }
  }

  return null;
}

export async function skipAndroidUpdateVersion(versionName: string) {
  await SecureStore.setItemAsync(SKIPPED_ANDROID_UPDATE_KEY, normalizeVersion(versionName));
}

async function isSkippedUpdate(versionName: string) {
  const skippedVersion = await SecureStore.getItemAsync(SKIPPED_ANDROID_UPDATE_KEY);
  return skippedVersion === normalizeVersion(versionName);
}

export async function checkForAndroidUpdate(options: CheckOptions = {}): Promise<AndroidUpdateCheckResult> {
  if (Platform.OS !== 'android') {
    return { status: 'unsupported', reason: 'Android APK updates are only available on Android.' };
  }

  if (Constants.executionEnvironment === 'storeClient') {
    return { status: 'unsupported', reason: 'Installable APK updates only work in the standalone Android app, not Expo Go.' };
  }

  try {
    const update = await fetchLatestAndroidUpdate();

    if (!update) {
      return { status: 'error', message: 'No Android APK asset was found in the latest GitHub release.' };
    }

    if (!isUpdateNewer(update)) {
      return {
        status: 'up-to-date',
        currentVersionName: getCurrentVersionName(),
        currentVersionCode: getCurrentVersionCode(),
      };
    }

    if (options.respectSkipped && await isSkippedUpdate(update.versionName)) {
      return { status: 'skipped', update };
    }

    return { status: 'available', update };
  } catch (error) {
    return { status: 'error', message: getAndroidUpdateErrorMessage(error) };
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9._-]/gi, '-');
}

export async function downloadAndInstallAndroidUpdate(update: AndroidUpdateInfo) {
  if (Platform.OS !== 'android') {
    throw new Error('Android APK updates are only available on Android.');
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error('Koe could not access the Android download cache.');
  }

  const fileUri = `${FileSystem.cacheDirectory}koe-update-${sanitizeFileName(update.versionName)}.apk`;
  const download = await FileSystem.downloadAsync(update.apkUrl, fileUri);

  if (download.status < 200 || download.status >= 300) {
    throw new Error(`APK download failed (${download.status}).`);
  }

  const info = await FileSystem.getInfoAsync(download.uri);
  if (!info.exists) {
    throw new Error('APK download finished, but the file could not be found.');
  }

  const contentUri = await FileSystem.getContentUriAsync(download.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: APK_MIME_TYPE,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
  });
}

export async function openAndroidUnknownAppSourcesSettings() {
  const packageName = Constants.expoConfig?.android?.package ?? 'com.jstar.koe';

  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, {
      data: `package:${packageName}`,
    });
  } catch {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.SECURITY_SETTINGS);
  }
}

export async function openAndroidUpdateRelease(update: AndroidUpdateInfo) {
  await Linking.openURL(update.releaseUrl ?? update.apkUrl);
}

export function getAndroidUpdateErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown update error.';

  if (/unknown|permission|install|activity|security/i.test(message)) {
    return `${message} Enable “Install unknown apps” for Koe, then try the update again.`;
  }

  return message;
}
