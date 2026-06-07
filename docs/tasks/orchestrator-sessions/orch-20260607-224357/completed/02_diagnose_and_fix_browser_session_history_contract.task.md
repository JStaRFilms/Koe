# Task 02: Diagnose and Fix Browser/Session History Contract

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

Takomi `vibe-build` stabilization. Read the feature doc, trace the browser recording path through account processing and snapshot history, then patch the smallest robust fix.

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260607-224357/master_plan.md`
- `docs/features/AccountHistorySessionGrouping.md`
- `docs/features/PromptRefinementDeduplication.md`
- `koe-website/app/api/v1/process/route.ts`
- `koe-website/app/api/v1/account/snapshot/route.ts`
- `koe-website/components/web-app/HistoryPanel.tsx`
- relevant browser recorder components/types under `koe-website/components/web-app/`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Repo-local Next/TypeScript debugging. |

## Objective

Make browser account history load as formatted grouped recording sessions with complete metadata: session ID, text selection/refined display, audio seconds, segment count/parts, and copy behavior.

## Scope

- Trace the browser recording process request shape and ensure a stable `clientSessionId` is created and posted.
- Confirm `/api/v1/process` accepts and persists `clientSessionId` into `transcript_history.client_session_id`.
- Confirm `/api/v1/account/snapshot` groups and maps rows into `recentHistory` without dropping `clientSessionId`.
- Confirm `HistoryPanel` renders formatted best/refined text by default and does not show raw-only/copy-only placeholders when refined exists.
- Preserve fallback visibility for legacy rows with missing session IDs.

## Context

User says browser history shows recording length and parts uploaded correctly, but not the rest of the formatted history; timestamp/audio seconds were transmitted while session ID was missing. v1.8 rows without session IDs created repeated transcript entries before the refined version.

## Definition Of Done

- New browser recordings include a session ID through the full request->DB->snapshot->UI chain.
- History card uses grouped formatted text, with raw/refined toggle when appropriate.
- Legacy no-session rows remain visible and safe.
- Type checks for website pass.

## Expected Artifacts

- Code diffs in website process/snapshot/history/recorder files as needed.
- Verification commands and concise root-cause note.

## Constraints

- Do not change quota/accounting semantics; per-request usage remains per request.
- Do not expose auth tokens/API keys.
- Avoid database migrations unless unavoidable.

## Verification

Run at minimum focused TypeScript checks for website. If possible, add/update targeted tests or a small script for snapshot grouping logic.

## Completion Notes - 2026-06-07

- Browser recorder now creates a stable `web-${crypto.randomUUID()}` client session ID at recording start and posts the same value with the `/api/v1/process` form request.
- `/api/v1/process` now normalizes/limits `clientSessionId`, includes it in responses, and backfills missing `transcript_history.client_session_id` on idempotent retries.
- `recordTranscriptHistory` now preserves/backfills `client_session_id` on existing request rows without changing usage/accounting writes.
- Existing snapshot grouping and `HistoryPanel` refined/raw rendering were traced and left intact because they already preserve no-session fallback rows and render refined text by default.
- Verification: `pnpm --filter website type-check` passed.
