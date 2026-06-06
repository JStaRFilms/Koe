# Task 03: GPT-OSS Model Audit and Switch Plan

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow

- Takomi workflow: `vibe-build`
- Role: code

### Prime Agent Context

Read first:

- `docs/tasks/orchestrator-sessions/orch-20260605-180656/master_plan.md`
- `packages/koe-core/src/constants.ts`
- `apps/mobile/src/providers/mobile-provider.ts`
- `src/main/services/groq.js`
- `apps/mobile/src/storage/settings-storage.ts`
- `src/shared/constants.js`

### Optional Skill / Context Overlays

| Overlay | Why |
|---|---|
| none | Targeted repo audit and constants update |

## Objective

Ensure mobile and desktop refinement use the intended GPT-OSS model now that Kimi K2 is disabled, and produce/perform the minimal safe code changes.

## Scope

- Search for Kimi/K2/model references.
- Confirm current enhancement model source of truth.
- If stale Kimi model constants exist, replace with GPT-OSS.
- If the requested “GPT OSS 12B” is ambiguous, preserve current `openai/gpt-oss-120b` or recommend exact alternative.
- Keep transcription models (`whisper-large-v3*`) separate from text refinement models.

## Context

Repo scan found `packages/koe-core/src/constants.ts` already uses `DEFAULT_ENHANCE_MODEL = 'openai/gpt-oss-120b'`. Mobile imports this constant. Need verify no Kimi usage remains in app code and document whether a code change is actually necessary.

## Definition Of Done

- No active mobile/desktop app code uses Kimi K2 for refinement.
- GPT-OSS model constant is centralized and used consistently.
- Any code edits pass relevant type/build checks.

## Expected Artifacts

- Diff if changes are needed.
- Short result explaining current model state and verification.

## Constraints

- Do not change Whisper transcription model choices while changing refinement model.
- Do not hardcode an unverified/nonexistent Groq model ID.

## Verification

- `rg -n "kimi|k2|moonshot|DEFAULT_ENHANCE_MODEL|gpt-oss" packages src apps/mobile`
- `pnpm --filter @koe/core build`
- `pnpm --filter koe-mobile type-check`
