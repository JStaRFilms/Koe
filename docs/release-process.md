# Release Process

This project has two release tracks:

1. **Desktop** — Windows/macOS artifacts built by GitHub Actions and used by `electron-updater`.
2. **Mobile Android APK** — signed APK built with EAS and attached to GitHub Releases for the in-app Android updater.

## Version Source Of Truth

### Desktop

- Desktop version comes from the root `package.json`.
- Desktop release tags must match the root version exactly.
- Example:
  - `package.json` version: `1.1.5`
  - release tag: `v1.1.5`

The desktop release workflow fails on purpose if the tag and root `package.json` version do not match.

### Mobile Android

- Mobile app version comes from:
  - `apps/mobile/package.json`
  - `apps/mobile/app.json` → `expo.version`
- Android build number comes from:
  - EAS remote auto-increment when using the `release-apk` profile
  - `apps/mobile/app.json` → `expo.android.versionCode` as a local fallback

For clean releases, keep the mobile package version and Expo version the same.

## Desktop Release Flow

The desktop workflow lives at `.github/workflows/build-release.yml`.

It does this:

1. Checks out the tagged commit.
2. Validates root `package.json` version against the release tag.
3. Creates the GitHub Release if it does not exist yet.
4. Builds Windows on `windows-latest`.
5. Builds macOS on `macos-latest`.
6. Uploads build artifacts to the workflow run.
7. Uploads release artifacts to the matching GitHub Release.

Desktop uploaded artifacts:

Windows:
- `.exe`
- `.blockmap`
- `latest.yml`

macOS:
- `.dmg`
- `.zip`
- `latest-mac*.yml`

Those metadata files are required for `electron-updater`.

### Recommended Desktop Release

Use local builds for smoke testing only. Use GitHub Actions for real desktop release artifacts.

```bash
pnpm version patch --no-git-tag-version
pnpm install
pnpm type-check
git add package.json pnpm-lock.yaml .
git commit -m "Release v1.1.6"
git push origin main
git tag v1.1.6
git push origin v1.1.6
```

Once the tag is pushed, GitHub Actions builds and publishes Windows/macOS artifacts.

## Android APK Release Flow

Koe Android checks GitHub Releases for the newest non-draft release that contains an `.apk` asset. If the APK version is newer than the installed app, Koe prompts the user to download and open Android's installer.

Android cannot silently install sideloaded updates. The user must approve the system installer prompt.

### Recommended Android Build Method

Use **EAS cloud builds** for real Android APKs. You can trigger the build from your PC, but EAS builds from committed git state.

Important: commit and push your changes before running an EAS build, otherwise EAS may build an older commit.

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile release-apk --platform android
```

When the build finishes, get the APK URL from EAS, download it, and attach it to the matching GitHub Release.

Preferred APK asset name:

```text
koe-android-v1.1.6.apk
```

### Android Release Steps

1. Bump mobile version in both files:
   - `apps/mobile/package.json`
   - `apps/mobile/app.json` → `expo.version`
2. Make sure Android version code/build number increases.
   - The `release-apk` EAS profile has `autoIncrement: true`.
   - Keep `expo.android.versionCode` reasonable as a fallback.
3. Commit and push the version bump.
4. Run the EAS APK build:

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile release-apk --platform android
```

5. Download the APK from EAS.
6. Create or open a GitHub Release for the mobile version tag, for example `v1.1.6`.
7. Upload the APK asset.
8. Existing Android users will see the update prompt on next launch, or from Settings → Android Updates → Check now.

### Android Version Bump Shortcut

There is no dedicated repo script yet, but these commands are safe shortcuts.

Patch bump the mobile package version:

```bash
cd apps/mobile
pnpm version patch --no-git-tag-version
```

Then manually copy the same version into `apps/mobile/app.json` → `expo.version` and increment `expo.android.versionCode` if you are not relying on EAS remote auto-increment.

For minor/major bumps:

```bash
cd apps/mobile
pnpm version minor --no-git-tag-version
pnpm version major --no-git-tag-version
```

Before release, verify:

```bash
pnpm --filter koe-mobile type-check
pnpm --filter koe-mobile exec expo config --type public
```

## Desktop vs Android Release Interaction

### If a GitHub Release has desktop artifacts but no APK

- Android updater skips that release and searches recent non-draft releases for one with an APK.
- If no APK is found, Android shows no launch popup. Settings may show that no Android APK was found.

### If a GitHub Release has only an Android APK

- Android updater can use it.
- Desktop updater may log a missing metadata error because `electron-updater` expects files like `latest.yml` / `latest-mac*.yml` on the latest release.
- Desktop should not install the APK, but Android-only latest releases can make desktop update checks noisy.

Best options:

1. Prefer combined releases that include desktop artifacts and Android APK assets together, or
2. Use a separate Android manifest URL with `EXPO_PUBLIC_KOE_ANDROID_UPDATE_MANIFEST_URL` if Android releases need to move independently from desktop.

## Manual Desktop Rebuilds

You can rebuild a desktop release manually from GitHub Actions with `workflow_dispatch`.

Input:
- `release_tag`: for example `v1.1.6`

The workflow checks out that exact tag, rebuilds, and re-uploads artifacts with `--clobber`.

## Development Android Builds

To test native modules on a physical Android device, create a development build:

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile development --platform android
```

For quickest internal APK testing without publishing a release:

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile preview --platform android
```

## Retrying A Failed EAS Build

If an Android or iOS build fails:

1. Read the EAS build page and logs first.
2. Reproduce locally when possible.
3. If the issue is in repo code or config, commit and push the fix before retrying.
4. Retry the build from `apps/mobile`.

Useful local verification:

```bash
pnpm build:core
pnpm type-check
cd apps/mobile
pnpm exec expo export:embed --eager --platform android --dev false
```

## Notes For Another Agent

- Do not treat latest GitHub release as the only source of truth for desktop correctness.
- Desktop source of truth is the git tag plus root `package.json`.
- Mobile source of truth is `apps/mobile/package.json` plus `apps/mobile/app.json`.
- Do not build macOS locally from Windows.
- Keep desktop release automation on GitHub-hosted runners.
- Use EAS cloud builds for signed Android APK release builds.
- If desktop updater stops working, first verify that the correct `latest.yml` and `latest-mac*.yml` files were uploaded to the matching GitHub Release.
- If Android updater stops working, verify that a recent non-draft GitHub Release contains an `.apk` asset and that the APK version is newer than the installed app.
