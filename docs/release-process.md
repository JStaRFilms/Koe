# Release Process

This project should use GitHub Actions for release builds.

## Source Of Truth

- App version comes from `package.json`.
- Release tags must match that version exactly.
- Example:
  `package.json` version is `1.0.5`
  release tag must be `v1.0.5`

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
git commit -m "Release v1.0.5"
git push origin main
git tag v1.0.5
git push origin v1.0.5
```

Once the tag is pushed, GitHub Actions automatically builds and publishes the Windows and macOS release artifacts.

## Manual Rebuilds

You can rebuild a release manually from GitHub Actions with `workflow_dispatch`.

Use this when:
- a runner failed
- you changed workflow-only logic
- you need to republish artifacts for an existing tag

Input:
- `release_tag`: for example `v1.0.5`

The workflow checks out that exact tag, rebuilds, and re-uploads the artifacts with `--clobber`.

## Mobile Release Flow (Expo)

Mobile store builds are intended to use **Expo Application Services (EAS)**, but EAS project config is not committed in this repo yet.

### Development Builds
To test native modules on a physical device, first add your Expo/EAS project config, then create a development build:
```bash
cd apps/mobile
pnpm dlx eas-cli build --profile development --platform ios # or android
```

### Production Store Submissions
1. Add `eas.json` and connect the app to the correct Expo project.
2. Ensure `app.json` has the correct `version` and platform build numbers.
3. Run EAS Build:
```bash
pnpm dlx eas-cli build --profile production --platform all
```
4. Use `eas submit` to send builds to the Apple App Store or Google Play Store.

---

## Notes For Another Agent

- Do not treat "latest GitHub release" as the source of truth for Desktop.
- The source of truth is the git tag plus `package.json`.
- Mobile versions are managed in `apps/mobile/app.json`.
- Do not build macOS locally from Windows.
- Keep release automation on GitHub-hosted runners.
- If release automation changes, keep the tag/version validation in place.
- If the updater stops working, first verify that the correct `latest.yml` and `latest-mac*.yml` files were uploaded to the matching GitHub Release.
