# UX & Design Guidelines (Terminal Noir)

## 1. Guiding Principles
- **Function over Form (Visually):** The UI must look like a machine interface. Information is presented in stark, unyielding blocks.
- **High Contrast:** Readability is achieved through raw contrast (Bone on Void) rather than subtle shading.
- **No Softness:** Absolutely no `border-radius`, no drop-shadows (unless it is a solid brutalist hard-shadow), and no soft gradients.
- **System Feedback:** Every interaction should feel like a terminal command. Utilize `[BRACKETS]`, `>` carets, and uppercase text.

## 2. Interactive Patterns
- **Hover States:** Utilizing the `.glitch-hover` class. Text turns `Amber`, background turns `Zinc`, and a raw `text-shadow` glitch effect pushes red/blue sub-pixels to the sides.
- **Collapsible Menus (FAQ):** Built purely with HTML `<details>` and `<summary>`. No JS required. Plus/Minus icons in `Amber`.
- **Dark Mode Toggle:** A system command `TOGGLE.MODE()`. When activated, it swaps the semantic tokens, resulting in a stark, blinding "Light Mode" (Bone background, Void text) mimicking an inverted terminal.

## 3. Layout Directives
- **Grid Strictness:** Components are locked into structural borders using `.border-raw`.
- **Asymmetry:** Allow large, empty blocks of `Void` or `Zinc/10` to balance heavy text.
- **Background Typography:** Use massive, translucent Japanese characters (`Giant Kanji`) behind content blocks for depth without breaking the flat UI aesthetic.

## 4. Animation Rules
- **Flicker:** Use `.crt-flicker` sparingly on active system statuses (e.g., `SYS.ONLINE`).
- **Pulse:** Used for recording states (a solid red square/circle blinking).
- **Marquee:** Used as section dividers to communicate high-density information ("NO SUBSCRIPTIONS // LOCAL VAD...").

## 5. Accessibility Constraints
- Despite the terminal aesthetic, color contrast ratios MUST exceed WCAG AA standards.
- `Bone` (#E2DFD2) on `Void` (#050505) achieves a 14:1 contrast ratio.
- `Amber` (#FFB000) on `Void` achieves a 10:1 contrast ratio.
