# Task: Phase 2 — Design System + Mockups

**Session ID:** orch-20260304-183000  
**Source:** Vision Brief — Koe Marketing Website  
**Context:** Creating comprehensive design system and visual mockups for the Koe website  
**Priority:** P0 (Blocking)  
**Dependencies:** 01_genesis (PRD must be complete)  
**Created At:** 2026-03-04

---

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> **Primary Workflow:** `/vibe-design`
>
> This workflow guides the creation of design systems, mockups, and visual specifications.

### Required Skills
> **Inject these skills into your context:**
>
> | Skill | Path | Why |
> |-------|------|-----|
> | `ui-ux-pro-max` | `C:/Users/johno/.kilocode/skills/ui-ux-pro-max/SKILL.md` | Design guidelines and patterns |
> | `frontend-design` | `C:/Users/johno/.kilocode/skills/frontend-design/SKILL.md` | Polished, non-generic UI |

---

## 📋 Objective

Create a comprehensive design system and visual mockups for the Koe marketing website, including:
1. **DESIGN.md** — Complete design system specification
2. **DESIGN_GUIDELINES.md** — UI/UX patterns and best practices
3. **Mockup.md** — Visual mockups for all page sections

---

## 🎯 Scope

**In Scope:**
- [ ] Create `koe-website/docs/DESIGN.md` — Full design system
- [ ] Create `koe-website/docs/DESIGN_GUIDELINES.md` — UI/UX patterns
- [ ] Create `koe-website/docs/Mockup.md` — Page section mockups
- [ ] Define color palette, typography, spacing system
- [ ] Design all 8 MUST-HAVE feature sections

**Out of Scope:**
- Actual code implementation (Phase 3)
- Interactive prototypes
- Asset generation (images, videos)

---

## 📚 Context

### Product Overview
**Koe (声)** — A free, open-source voice dictation app for Windows. The marketing website must feel professional, trustworthy, and developer-friendly while being accessible to all users.

### Page Layout (from Vision Brief)

```
┌─────────────────────────────────────┐
│  Logo        Nav        [Download]  │  ← Sticky nav
├─────────────────────────────────────┤
│                                     │
│   [ANIMATED WAVEFORM BACKGROUND]    │
│                                     │
│   "Free Voice Dictation"            │
│   "that actually works"             │
│                                     │
│   [Watch Demo] [Download for Win]   │
│                                     │
│   ✓ Free forever  ✓ Privacy-first   │
│                                     │
├─────────────────────────────────────┤
│  TRUSTED BY / SOCIAL PROOF          │
│  (GitHub stars, download count)     │
├─────────────────────────────────────┤
│  HOW IT WORKS (3 steps)             │
│  [1] → [2] → [3]                    │
├─────────────────────────────────────┤
│  FEATURES GRID                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Feat1│ │Feat2│ │Feat3│ │Feat4│   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
├─────────────────────────────────────┤
│  COMPARISON TABLE                   │
│  Koe vs WhisperFlow vs OS Dictation │
├─────────────────────────────────────┤
│  DEMO SECTION                       │
│  [Video/GIF of app in action]       │
├─────────────────────────────────────┤
│  TESTIMONIALS (if available)        │
├─────────────────────────────────────┤
│  OPEN SOURCE CTA                    │
│  "Built in the open" → GitHub link  │
├─────────────────────────────────────┤
│  FOOTER                             │
│  Links, GitHub, License info        │
└─────────────────────────────────────┘
```

### Design Direction (from Vision Brief)

**Color Palette:**
- Primary: Deep teal/slate (`#0f172a`) — professional, trustworthy
- Accent: Warm amber (`#f59e0b`) — energy, voice, warmth
- Background: Off-white/cream (`#fafaf9`) — easy on eyes
- Success: Emerald (`#10b981`) — free, open source
- Text Primary: Slate-900 (`#0f172a`)
- Text Secondary: Slate-600 (`#475569`)

**Typography:**
- Headings: Inter (bold, clean)
- Body: Inter or Geist (readable)
- Accent/Code: JetBrains Mono (for code/tech elements)

**Key Design Elements:**
1. **Waveform Animations** — Subtle audio waveforms as decorative elements
2. **Glassmorphism Cards** — For feature highlights (like Koe's pill UI)
3. **Keyboard Shortcut Badges** — Visual `Ctrl + Shift + Space` badges
4. **Dark Mode Toggle** — Match Koe app's theme capability

### MUST-HAVE Feature Sections to Design

| ID | Feature | Design Requirements |
|----|---------|---------------------|
| FR-001 | Hero Section | Large typography, waveform background, dual CTAs, trust badges |
| FR-002 | Download Integration | Download button with version badge, platform indicator |
| FR-003 | Features Section | 4 feature cards with icons, descriptions, and visual mockups |
| FR-004 | Comparison Table | Clean table showing Koe advantages over competitors |
| FR-005 | GitHub Link | "Star on GitHub" buttons, star count display |
| FR-006 | Responsive Design | Mobile-first breakpoints: sm(640), md(768), lg(1024), xl(1280) |
| FR-007 | SEO Metadata | Social card preview design (OG image dimensions) |
| FR-008 | Privacy Page | Clean, readable typography for policy text |

---

## ✅ Definition of Done

- [ ] `koe-website/docs/DESIGN.md` created with complete design system
- [ ] `koe-website/docs/DESIGN_GUIDELINES.md` created with UI/UX patterns
- [ ] `koe-website/docs/Mockup.md` created with visual specifications for all sections
- [ ] Color palette defined with hex codes and usage guidelines
- [ ] Typography scale defined (sizes, weights, line heights)
- [ ] Spacing system defined (padding, margin, gap scales)
- [ ] Component specifications for: buttons, cards, badges, navigation
- [ ] Responsive breakpoints documented
- [ ] Animation specifications (timing, easing, transforms)

---

## 📁 Expected Artifacts

| File | Purpose |
|------|---------|
| `koe-website/docs/DESIGN.md` | Complete design system |
| `koe-website/docs/DESIGN_GUIDELINES.md` | UI/UX patterns and best practices |
| `koe-website/docs/Mockup.md` | Visual mockups for all page sections |

---

## 🚫 Constraints

- Design must follow the teal/amber/cream color scheme
- Must be professional and developer-friendly
- All designs must specify mobile, tablet, and desktop layouts
- Use shadcn/ui components as base where applicable
- Keep animations performant (use transform/opacity only)

---

**When Done:**
- Create `02_design.result.md` in the completed folder
- Include which workflow and skills you used
- Signal completion with `attempt_completion` tool

---

*Generated by vibe-orchestrator mode*
