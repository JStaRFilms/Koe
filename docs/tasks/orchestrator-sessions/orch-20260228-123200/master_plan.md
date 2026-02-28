# Koe (声) — Orchestrator Master Plan

**Session ID:** `orch-20260228-123200`
**Vision Brief:** `docs/Vision_Brief.md`
**Status:** Genesis Phase (Scaffolding)

---

## Skills Registry

| Skill | Path | Applies To |
|---|---|---|
| `frontend-design` | `skills/frontend-design/SKILL.md` | Phase 4 (UI) |
| `ui-ux-pro-max` | `skills/ui-ux-pro-max/SKILL.md` | Phase 4 (UI) |
| `webapp-testing` | `skills/webapp-testing/SKILL.md` | Verification |

> **Note:** Context7 excluded (currently unavailable per user).

---

## Workflows Registry

| Workflow | Applies To |
|---|---|
| `/vibe-genesis` | Phase 0 — Genesis |
| `/vibe-build` | Phases 1-6 — Implementation |
| `/mode-review` | After each phase |
| `/vibe-finalize` | Phase 6 — Packaging |

---

## Task Decomposition

| # | Task | Phase | Skills | Status |
|---|---|---|---|---|
| 00 | Genesis: PRD + Issues + Guidelines | 0 | — | 🟡 In Progress |
| 01 | Electron + Vite Scaffold | 1 | — | ⬜ Pending |
| 02 | System Tray + Hotkey | 1 | — | ⬜ Pending |
| 03 | Audio Pipeline (Mic + VAD + WAV) | 2 | — | ⬜ Pending |
| 04 | Groq Whisper Integration | 3 | — | ⬜ Pending |
| 05 | Rate Limiter | 3 | — | ⬜ Pending |
| 06 | Floating Window UI | 4 | frontend-design, ui-ux-pro-max | ⬜ Pending |
| 07 | Llama Enhancement + Settings | 5 | — | ⬜ Pending |
| 08 | Clipboard + Auto-paste | 5 | — | ⬜ Pending |
| 09 | History + Usage Meter | 6 | — | ⬜ Pending |
| 10 | Packaging (electron-builder) | 6 | — | ⬜ Pending |

### Dependency Graph

```
00 Genesis ──► 01 Scaffold ──► 02 Tray+Hotkey ──► 03 Audio ──► 04 Whisper
                                                                    │
                                                               05 Rate Limiter
                                                                    │
                                                               06 UI (parallel w/ 04-05)
                                                                    │
                                                          07 Enhancement + Settings
                                                                    │
                                                            08 Clipboard + Paste
                                                                    │
                                                        09 History + Usage Meter
                                                                    │
                                                             10 Packaging
```

---

## Progress Tracking

- [/] Phase 0: Genesis
- [ ] Phase 1: Skeleton
- [ ] Phase 2: Audio Pipeline
- [ ] Phase 3: Groq Integration
- [ ] Phase 4: UI
- [ ] Phase 5: Enhancement
- [ ] Phase 6: Polish
