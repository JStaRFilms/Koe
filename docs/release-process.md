# Release Process

This project should use GitHub Actions for release builds.

## Source Of Truth

- App version comes from `package.json`.
- Release tags must match that version exactly.
- Example:
  `package.json` version is `1.1.0`
  release tag must be `v1.1.0`
  `package.json` version is `1.1.0`
  release tag must be `v1.1.0`

If the tag and `package.json` version do not match, the release workflow fails on purpose.

## Workflow

The release workflow lives at [.github/workflows/build-release.yml](/C:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-02-28_whisper_alt-V2/.github/workflows/build-release.yml).

It does this:

1. Checks out the tagged commit.
2. Validates `package.json` version against the release tag.
3. Creates the GitHub Release if it does not exist yet.
4. Builds Windows on `windows-latest`.
5. Builds macOS on `macos-latest`.
6. Uploads build artifacts to the workflow run.
7. Uploads release artifacts to the matching GitHub Release.

In CI, the workflow uses non-publishing build scripts so `electron-builder` only creates artifacts and does not try to publish on its own.

## What Gets Uploaded

Windows:
- `.exe`
- `.blockmap`
- `latest.yml`

macOS:
- `.dmg`
- `.zip`
- `latest-mac*.yml`

Those metadata files are required for `electron-updater`.

## Recommended Release Flow

Use local builds for smoke testing only. Use GitHub Actions for real release artifacts.

Steps:

1. Update `package.json` to the new version.
2. Commit the version bump and other release changes.
3. Push the branch.
4. Create and push a matching git tag.

Example:

```bash
git add package.json pnpm-lock.yaml .
git commit -m "Release v1.1.0"
git commit -m "Release v1.1.0"
git push origin main
git tag v1.1.0
git push origin v1.1.0
git tag v1.1.0
git push origin v1.1.0
```

Once the tag is pushed, GitHub Actions automatically builds and publishes the Windows and macOS release artifacts.

## Manual Rebuilds

You can rebuild a release manually from GitHub Actions with `workflow_dispatch`.

Use this when:
- a runner failed
- you changed workflow-only logic
- you need to republish artifacts for an existing tag

Input:
- `release_tag`: for example `v1.1.0`
- `release_tag`: for example `v1.1.0`

The workflow checks out that exact tag, rebuilds, and re-uploads the artifacts with `--clobber`.

## Mobile Release Flow (Expo)

Mobile store and internal builds use **Expo Application Services (EAS)**.

This repo already includes:
- `apps/mobile/eas.json`
- the linked Expo project ID in `apps/mobile/app.json`
- an `eas-build-post-install` hook in `apps/mobile/package.json` that builds `@koe/core` before Expo bundles the mobile app

### Important Build Rule

EAS builds from committed git state, not your uncommitted local files.

If you fix a build issue locally and immediately retry without committing and pushing, the cloud build will still use the older broken commit.
Mobile store and internal builds use **Expo Application Services (EAS)**.

This repo already includes:
- `apps/mobile/eas.json`
- the linked Expo project ID in `apps/mobile/app.json`
- an `eas-build-post-install` hook in `apps/mobile/package.json` that builds `@koe/core` before Expo bundles the mobile app

### Important Build Rule

EAS builds from committed git state, not your uncommitted local files.

If you fix a build issue locally and immediately retry without committing and pushing, the cloud build will still use the older broken commit.

### Development Builds
To test native modules on a physical device, create a development build:
To test native modules on a physical device, create a development build:
```bash
cd apps/mobile
pnpm dlx eas-cli build --profile development --platform ios # or android
```

### Internal Android Preview Builds

Use this for the quickest installable Android build:

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile preview --platform android
```

When the build finishes, get the APK URL with either of these commands:

```bash
cd apps/mobile
pnpm dlx eas-cli build:list --platform android --limit 2 --non-interactive
```

Look for:

- `Application Archive URL`

Or query one specific build directly:

```bash
cd apps/mobile
pnpm dlx eas-cli build:view <BUILD_ID> --json
```

Look for:

- `artifacts.buildUrl`
- `artifacts.applicationArchiveUrl`

That APK URL is what the website should use for:

```bash
NEXT_PUBLIC_KOE_ANDROID_URL=<finished Expo Android build/install URL>
```

### Production Store Submissions
1. Ensure `app.json` has the correct `version` and platform build numbers.
2. Run EAS Build:
1. Ensure `app.json` has the correct `version` and platform build numbers.
2. Run EAS Build:
```bash
pnpm dlx eas-cli build --profile production --platform all
```
3. Use `eas submit` to send builds to the Apple App Store or Google Play Store.

For iPhone, the public website should not point at GitHub Releases. Use the TestFlight invite/public link:

```bash
NEXT_PUBLIC_KOE_IOS_URL=<TestFlight invite URL>
```

If a platform URL is missing, the website should show that platform as coming soon instead of showing a broken install button.

### Retrying A Failed EAS Build

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

Typical retry command:

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile preview --platform android
```
3. Use `eas submit` to send builds to the Apple App Store or Google Play Store.

For iPhone, the public website should not point at GitHub Releases. Use the TestFlight invite/public link:

```bash
NEXT_PUBLIC_KOE_IOS_URL=<TestFlight invite URL>
```

If a platform URL is missing, the website should show that platform as coming soon instead of showing a broken install button.

### Retrying A Failed EAS Build

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

Typical retry command:

```bash
cd apps/mobile
pnpm dlx eas-cli build --profile preview --platform android
```

---

## Notes For Another Agent

- Do not treat "latest GitHub release" as the source of truth for Desktop.
- The source of truth is the git tag plus `package.json`.
- Mobile versions are managed in `apps/mobile/app.json`.
- Do not build macOS locally from Windows.
- Keep release automation on GitHub-hosted runners.
- If release automation changes, keep the tag/version validation in place.
- If the updater stops working, first verify that the correct `latest.yml` and `latest-mac*.yml` files were uploaded to the matching GitHub Release.
