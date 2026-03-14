# Task 07: Redesign The Mobile App Shell

**Session ID:** orch-20260312-184412-mobile-v1  
**Source:** Takomi mobile orchestrator  
**Priority:** P1  
**Dependencies:** Tasks 04 and 05  
**Created At:** 2026-03-13T11:25:00Z

---

## Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Read and follow:
> - `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md`
> - `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md`

### Prime Agent Context
> MANDATORY: run the Takomi prime-agent workflow first.  
> Then read:
> - `docs/tasks/orchestrator-sessions/orch-20260312-184412-mobile-v1/master_plan.md`
> - outputs from Tasks 03 through 05
> - mobile UI files under `apps/mobile/app/`
> - brand references from:
>   - `koe-website/app/page.tsx`
>   - `koe-website/components/Navbar.tsx`
>   - `koe-website/public/logo.svg`

### Required Skills
> Load these skills before coding:
>
> | Skill | Path | Why |
> |---|---|---|
> | `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Workflow orchestration |
> | `frontend-design` | `C:/Users/johno/.codex/skills/frontend-design/SKILL.md` | Distinctive, production-grade UI direction |
> | `building-native-ui` | `C:/Users/johno/.codex/skills/building-native-ui/SKILL.md` | Native-feeling Expo app behavior |

### Check Additional Skills
> Scan the available skills list and load anything clearly relevant before editing.

---

## Objective

Replace the current placeholder-feeling mobile shell with a deliberate product UI that feels branded, coherent, and worth shipping.

## Scope

**In scope:**
- recorder screen visual redesign
- history screen visual redesign
- settings screen layout and control redesign
- onboarding screen redesign
- shared visual language across tabs
- better visual hierarchy, spacing, typography, and motion

**Out of scope:**
- changing the underlying audio/provider pipeline semantics
- Android IME work
- backend or account flows

## Product Direction To Respect

- The current shell is not good enough. Treat this as a real redesign, not a light polish pass.
- Do not default to cliché AI-neon or purple cyberpunk styling.
- Use visual choices that fit Koe's existing brand direction from the website.
- Reuse the `声` brand mark from the website where it makes sense.
- Preserve a recorder-first mobile product shape.

## Design Requirements

### Brand Alignment

- Reference the existing website brand implementation:
  - giant background `声` motif in `koe-website/app/page.tsx`
  - navbar lockup in `koe-website/components/Navbar.tsx`
  - `public/logo.svg`
- The mobile app should feel related to that identity, not like a separate AI template.

### Recorder Screen

- Make the recorder the visual centerpiece.
- Preserve all real states from Task 05:
  - idle
  - recording
  - processing
  - copied
  - empty
  - error / retry available
- Make retry/discard affordances obvious without clutter.
- Keep clipboard-first completion clear.

### History Screen

- Turn history into a real product view, not just stacked cards.
- Improve timestamp hierarchy, transcript scanning, and copy-again affordance.
- If refined text differs from raw text, that relationship should be legible.

### Settings Screen

- Make BYOK and preferences feel intentional and trustworthy.
- Improve grouping for:
  - API key storage
  - enhancement toggle
  - prompt style
  - language
- The provider name must not be sprayed across the product UI.
- The only place the app should explicitly mention `Groq` is at the API key entry/help surface.
- If needed, add a small helper or tooltip near the API key field that tells users where to get a Groq API key.
- Remove technical or internal-jargon labels from customer-facing UI. For example, replace text like `pipeline notes` with normal human wording.
- Avoid generic settings-list UI if a better branded layout is possible.

### Onboarding

- Keep onboarding short and sharp.
- Match the real product behavior:
  - direct BYOK processing
  - clipboard-first flow
  - no fake local-only claims
- Do not mention Groq in onboarding copy.

## Technical Requirements

- Use `Theme.ts` tokens where possible, but expand/refactor tokens if the current set is too weak for a proper design system.
- Keep Expo Router structure intact.
- Preserve type safety and existing working flows.
- Introduce reusable presentation components if that improves quality:
  - state cards
  - branded headers
  - reusable action rows
  - shared screen chrome

## Files To Create Or Modify

| File | Action | Purpose |
|---|---|---|
| `apps/mobile/app/index.tsx` | Modify | Recorder-first redesign |
| `apps/mobile/app/history.tsx` | Modify | Real history UX |
| `apps/mobile/app/settings.tsx` | Modify | Branded settings UX |
| `apps/mobile/app/onboarding.tsx` | Modify | Better first-run UX |
| `apps/mobile/app/_layout.tsx` | Modify if needed | Navigation chrome alignment |
| `apps/mobile/src/constants/Theme.ts` | Modify if needed | Stronger mobile design tokens |
| `apps/mobile/src/components/*` | Create/Modify | Shared branded UI components |

## Definition Of Done

- [x] The mobile shell no longer looks like a scaffold
- [x] The `声` brand mark is used intentionally where appropriate
- [x] The visual system feels related to the website, without copying web layout literally
- [x] The design avoids cliché purple-neon AI styling
- [x] Recorder, history, settings, and onboarding all feel coherent
- [x] Existing Task 05 functionality still works

## Constraints

- Do not degrade the working pipeline logic
- Do not introduce fake interactions or fake data states as the primary UI
- Keep the experience mobile-native, not web-page-in-a-phone
- Do not leave provider-brand references all over the product shell.
- Use plain-language labels and helper text, not internal engineering terms.

## Verification

- `pnpm --filter koe-mobile type-check`
- `pnpm exec expo install --check` in `apps/mobile`
- `pnpm exec expo export --platform web --output-dir .expo-export-task07`
- Manual route pass across recorder, history, settings, onboarding

---

*Generated by Takomi orchestrator | Session: orch-20260312-184412-mobile-v1*
