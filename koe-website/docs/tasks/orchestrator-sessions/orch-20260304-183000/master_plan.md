# Master Plan: Koe Marketing Website

**Session ID:** orch-20260304-183000  
**Created:** 2026-03-04  
**Source:** docs/Koe_Website_Vision_Brief.md  
**Status:** In Progress  
**Project:** Koe (声) — Voice Dictation Marketing Website

---

## Overview

This orchestrator session coordinates the build of Koe's professional marketing website. The website converts visitors into downloads by showcasing Koe's unique value proposition: completely free voice dictation powered by user's own Groq API key (BYOK model).

**Target Domain:** `koe.jstarstudios.com`

---

## Skills Registry

| Skill | Relevant? | Inject Into | Reasoning |
|-------|-----------|-------------|-----------|
| `nextjs-standards` | ✅ Yes | All build tasks | Project uses Next.js 15 App Router |
| `frontend-design` | ✅ Yes | Design + build tasks | Polished, non-generic UI required |
| `seo-ready` | ✅ Yes | All pages | Marketing site needs SEO optimization |
| `ui-ux-pro-max` | ✅ Yes | Design phase | Design guidelines and patterns |

---

## Workflows Registry

| Workflow | Relevant? | Used In Phase | Purpose |
|----------|-----------|---------------|---------|
| `/vibe-primeAgent` | ✅ Always | ALL tasks | Load project context |
| `/vibe-genesis` | ✅ Yes | Phase 1: Planning | Generate PRD + issues |
| `/vibe-design` | ✅ Yes | Phase 2: Design | Design system + mockups |
| `/vibe-build` | ✅ Yes | Phase 3: Build | Scaffold + implement |
| `/vibe-finalize` | ✅ Yes | Phase 4: Quality | Verify + deploy |

---

## Tasks

| # | Task File | Status | Mode | Workflow | Skills | Dependencies |
|---|-----------|--------|------|----------|--------|--------------|
| 1 | 01_genesis.task.md | Pending | vibe-architect | /vibe-genesis | nextjs-standards | None |
| 2 | 02_design.task.md | Pending | vibe-architect | /vibe-design | ui-ux-pro-max, frontend-design | 01_genesis |
| 3 | 03_scaffold.task.md | Pending | vibe-code | /vibe-build | nextjs-standards, frontend-design | 02_design |
| 4 | 04_features.task.md | Pending | vibe-code | /vibe-build | nextjs-standards, frontend-design | 03_scaffold |
| 5 | 05_finalize.task.md | Pending | vibe-review | /vibe-finalize | seo-ready | 04_features |

---

## MUST-HAVE Features Checklist

- [ ] **FR-001:** Hero Section — Bold headline "Free Voice Dictation", dual CTAs (Demo + Download)
- [ ] **FR-002:** Download Integration — Auto-detect latest GitHub release, link to `.exe`
- [ ] **FR-003:** Features Section — 3-4 key features with visual mockups/screenshots
- [ ] **FR-004:** Comparison Table — Koe vs WhisperFlow vs OS Dictation
- [ ] **FR-005:** GitHub Link — Prominent "Star on GitHub" CTAs
- [ ] **FR-006:** Responsive Design — Mobile, tablet, desktop layouts
- [ ] **FR-007:** SEO Metadata — Title, description, OG tags
- [ ] **FR-008:** Privacy Page — Privacy policy explaining data practices

---

## Architecture Requirements

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |
| Domain | `koe.jstarstudios.com` |

---

## Progress

- [ ] Phase 1: Genesis — PRD, Issues, Guidelines
- [ ] Phase 2: Design — Design System, Mockups
- [ ] Phase 3: Build — Scaffold, Features
- [ ] Phase 4: Finalize — SEO, Performance, Deploy

---

## Notes

**GitHub Repo:** `https://github.com/JStaRFilms/Koe-------Voice-Dictation-Desktop-App`

**Download Button:** Must auto-fetch latest release from GitHub API (cache to avoid rate limits)

**Design Direction:**
- Primary: Deep teal/slate (`#0f172a`)
- Accent: Warm amber (`#f59e0b`)
- Background: Off-white/cream (`#fafaf9`)
- Success: Emerald (`#10b981`)

**Key Design Elements:**
- Waveform animations
- Glassmorphism cards
- Keyboard shortcut badges
