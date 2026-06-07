# Prompt Refinement Deduplication

## Goal

Keep Koe's default Clean refinement prompt clear, compact, and consistent across desktop, mobile, and account-backed processing.

## Components

- Shared core: `packages/koe-core/src/constants.ts` defines the hidden Clean fallback prompt and refinement guardrails.
- Desktop: `src/main/services/groq.js` and `src/main/services/transcription-worker.js` compose the system prompt from shared guardrails and the resolved style prompt.
- Mobile: `apps/mobile/src/providers/mobile-provider.ts` uses the same shared guardrails and prompt resolver.
- Website/account backend: `koe-website/lib/refinement.ts` mirrors the shared prompt behavior for server-side account processing.

## Data Flow

1. User leaves `customPrompt` blank and uses `promptStyle: "Clean"`.
2. `resolveEnhancementPrompt` returns Koe's hidden Clean fallback prompt.
3. The final system prompt is `REFINEMENT_GUARDRAILS + resolved style prompt`.
4. The raw transcript is still isolated inside `<transcript>` tags in the user message.
5. Output sanitizers remove transcript tags and dash variants if a provider returns them anyway.

## Database Schema

No schema changes. Existing account settings continue to store `prompt_style` and `custom_prompt`; an empty custom prompt means Koe uses the default Clean fallback.

## Notes

- The cleanup removes duplicated instructions around em dashes, transcript tags, filler handling, and return-only behavior.
- Safety guardrails remain in the system prompt so transcript text is edited rather than followed as instructions.
