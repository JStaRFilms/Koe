# KOE V2 Design System (Terminal Noir)

> **Note**: This design system supersedes the original Phase 1 Vision Brief (teal/cream). We have pivoted to the "Terminal Noir / Art Deco" aesthetic (V2) as approved by the core engineering team.

## 1. Core Aesthetic: Terminal Noir
A brutalist, high-contrast, terminal-inspired aesthetic merging raw coding environments with stark Art Deco accents and Japanese typography.

## 2. Color Palette
Fully utilizing CSS Variables defined in Tailwind configuration:

| Name | Hex Code | Usage |
|------|----------|-------|
| **Void** (Background) | `#050505` | Primary background, deep space, canvas. |
| **Bone** (Text Primary) | `#E2DFD2` | Main text, borders in hover states, stark contrast elements. |
| **Amber** (Accent) | `#FFB000` | CTAs, Phosphor text, system warnings, active states. |
| **Crimson** (Danger) | `#8A0303` | Destructive actions, strikethroughs, critical errors. |
| **Muted** (Text Secondary) | `#666666` | Secondary text, inactive states, terminal history. |
| **Zinc** (Borders/UI) | `#1F1F1F` | Raw borders, structural grid lines, table dividers. |

## 3. Typography
| Role | Font Family | Fallback | Weights |
|------|-------------|----------|---------|
| **Display / Headers** | `Righteous` | `cursive` | 400 |
| **Body / Code / UI** | `IBM Plex Mono` | `monospace`| 400, 600, 700 |
| **Decorative Kanji** | `Noto Serif JP` | `serif` | 900 |

*All typography is inherently `uppercase` except for extremely specific long-form paragraph explanations.*

## 4. Spacing System
Standard Tailwind spacing scale with a heavy emphasis on macro-spacing (8, 16, 24, 32, 64px).

## 5. UI Components

### Buttons
- **Style:** Brutalist. Solid `Amber` background, `Void` text.
- **Border:** 2px solid `Amber`.
- **Hover State:** Background shifts to `Bone`, border to `Bone`, text to `Void`. Pseudo-element shadow collapses into the button.

### Borders
- **Style:** "Raw". 1px solid `Zinc`.
- **Usage:** Used explicitly to separate grid sections. No rounded corners (`rounded-none`).

### Accents
- **Scanlines:** Fixed overlay `rgba(0,0,0,0.25)` linear gradients over the entire viewport.
- **Grid Background:** 50px SVG-style linear-gradient grid using `Zinc`.
- **Marquee:** Infinite scrolling CSS text blocks for system statuses.
- **CRT Flicker:** `0.2s` infinite alternate keyframe animation adjusting opacity and text-shadow.

## 6. Implementation Notes
- Use exact `var(--color-void)` mappings in CSS blocks.
- Toggle between Light/Dark mode actually inverts `Void` and `Bone` via `.dark` class overrides on the `:root` element.
