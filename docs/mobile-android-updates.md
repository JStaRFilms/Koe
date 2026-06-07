# Mobile Android APK Updates

Koe mobile can now check GitHub Releases for a newer Android APK and prompt users to download/install it. This is for sideloaded Android builds before Play Store distribution.

## Release flow

1. Bump the mobile app version in `apps/mobile/app.json` and `apps/mobile/package.json`.
2. Make sure the Android build number/version code increases. EAS remote versioning can auto-increment this; `app.json` also includes `android.versionCode` as a local fallback.
3. Build a signed APK:

```bash
pnpm --filter koe-mobile exec eas build --platform android --profile release-apk
```

4. Create a GitHub Release with a tag matching the mobile version, for example `v1.1.5`.
5. Upload the APK asset to the release. Prefer a clear name like `koe-android-v1.1.5.apk`.

The app checks `https://api.github.com/repos/JStaRFilms/Koe/releases?per_page=20` by default and uses the newest non-draft release that contains an APK asset. This keeps desktop-only releases from breaking mobile update checks.

## Android user flow

- Koe checks for updates on app launch and in Settings.
- If a newer APK is found, users can tap **Download & install**.
- Android opens the system package installer.
- Users must approve the install manually.
- If Android blocks the install, users can tap **Install permission** in Settings and enable “Install unknown apps” for Koe.

## Configuration override

If you do not want to use the latest GitHub Release directly, set this Expo env var before building:

```bash
EXPO_PUBLIC_KOE_ANDROID_UPDATE_MANIFEST_URL=https://example.com/koe-android-update.json
```

Manifest shape:

```json
{
  "versionName": "1.1.5",
  "versionCode": 15,
  "apkUrl": "https://example.com/releases/koe-android-v1.1.5.apk",
  "releaseUrl": "https://github.com/JStaRFilms/Koe/releases/tag/v1.1.5",
  "releaseNotes": "Bug fixes and improvements"
}
```

## Important constraints

- Every APK update must use the same Android package name and be signed with the same Android signing key as the installed app.
- Every APK update must have a higher Android `versionCode` than the installed app. With EAS remote versioning, validate the built APK metadata before upload instead of relying only on the local fallback `android.versionCode`.
- Android does not allow silent sideload updates; the system installer prompt is required.
- This does not run in Expo Go. Test with a standalone/dev-client APK.
