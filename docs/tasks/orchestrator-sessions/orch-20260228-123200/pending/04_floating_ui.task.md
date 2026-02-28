# Task 04: Floating Window UI

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> Load: `cat .agent/workflows/vibe-build.md`

### Prime Agent Context
> MANDATORY: Run `/vibe-primeAgent` first
> Then read: `docs/Coding_Guidelines.md` and `docs/Builder_Prompt.md`

### Required Skills
| Skill | Path | Why |
|-------|------|-----|
| frontend-design | `skills/frontend-design/SKILL.md` | Premium UI for floating window |
| ui-ux-pro-max | `skills/ui-ux-pro-max/SKILL.md` | Color palette, typography, animations |

### Check Additional Skills
> Scan all known skills directories for more relevant skills (e.g., web-design-guidelines)

---

## Objective
Build the premium floating transcription window with glassmorphism design, live text display, recording state indicator, and micro-animations. This is the face of the app — it must look **stunning**.

## Scope
**Covers FRs:** FR-007 (Floating Window), FR-008 (Clipboard Integration)

**Files to Create/Modify:**
```
src/renderer/components/floating-window.js  — Main transcription display component
src/renderer/styles/floating.css            — Floating window glassmorphism styles
```

**Files to Modify:**
```
src/renderer/index.html    — Add floating window markup structure
src/renderer/index.js      — Wire up floating window + clipboard
src/renderer/styles/main.css — Extend design tokens
```

## Context
- **Prerequisite:** Task 03 (Groq Integration) should be complete (text flows in)
- Read FR-007, FR-008 issue files
- Load `frontend-design` and `ui-ux-pro-max` skills for design guidance

## Design Requirements

### Visual Identity
- **Theme:** Dark, premium, futuristic
- **Color Palette:** Deep dark backgrounds (#0a0a0f), accent color (vivid cyan/teal #00d4aa or electric violet #7c3aed), subtle gradients
- **Font:** Inter (Google Fonts) — 400 for body, 500 for labels, 600 for headers
- **Glassmorphism:** `backdrop-filter: blur(24px)`, `background: rgba(10, 10, 15, 0.8)`, subtle border glow
- **Border radius:** 16px for main container, 8px for inner elements
- **Shadow:** Multi-layer box-shadow for depth

### Layout (420x220 default)
```
┌──────────────────────────────────┐
│ 🎤 Koe          ─  ×  │ ← Draggable title bar
├──────────────────────────────────┤
│                                  │
│   Transcribed text appears       │ ← Auto-scrolling text area
│   here as you speak...           │
│                                  │
├──────────────────────────────────┤
│ ● Recording    📋 Copy    ⚙️     │ ← Status bar + actions
└──────────────────────────────────┘
```

### Recording States
- **Idle:** Subtle pulse on mic icon, muted accent color
- **Recording:** Pulsing red dot animation, waveform visualization (CSS only), glowing border
- **Processing:** Spinner/dots animation, "Transcribing..." text
- **Done:** Green flash, "Copied ✓" toast that fades out

### Micro-Animations
- Text appearance: fade-in from bottom (each new line)
- Recording pulse: CSS keyframe animation (scale + opacity)
- Toast notification: slide-in from bottom, fade-out after 2s
- Window show/hide: scale + opacity transition (200ms)
- Hover effects on buttons: subtle glow + scale(1.05)

### Clipboard Integration
- Auto-copy on transcription complete (if enabled)
- Copy button: click to copy current text
- Toast: "Copied to clipboard ✓" with checkmark animation
- Use `navigator.clipboard.writeText()` via preload bridge

## Definition of Done
- [ ] Floating window renders with glassmorphism design
- [ ] Window is frameless, draggable via title bar
- [ ] Live text updates as transcription arrives
- [ ] Recording indicator pulses when recording
- [ ] "Processing" state shows while waiting for API
- [ ] Copy button copies text to clipboard
- [ ] Auto-copy on transcription complete
- [ ] Toast notification on copy
- [ ] Minimize/close buttons work
- [ ] Window does not steal focus from other apps
- [ ] Design is premium — not generic/basic

## Expected Artifacts
- Floating window component + styles
- Updated index.html with proper markup
- All CSS animations working

## Constraints
- **Vanilla CSS only** — No Tailwind, no CSS frameworks
- **Vanilla JS only** — No React, no component libraries
- CSS custom properties for all colors/spacing (themeable)
- Must work on Electron's Chromium renderer
- Window size: 420x220 default, min 300x150, resizable
