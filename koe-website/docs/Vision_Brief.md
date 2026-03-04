# Vision Brief: Koe Marketing Website

**Project:** koe.jstarstudios.com  
**Type:** Product Landing Page + Marketing Website  
**Status:** Ready for Orchestration  
**Confidence Level:** High

---

## 🎯 The Idea

**One-liner:** A sexy, premium marketing website for Koe — the free voice dictation app that makes typing obsolete.

**Problem it solves:** WhisperFlow costs $8-10/mo. Koe is 100% free with the same (or better) features. The website needs to communicate this value proposition while looking premium enough to compete with paid alternatives.

**Target Audience:**
- Primary: Developers, writers, productivity enthusiasts on Windows
- Secondary: Anyone who types a lot and wants to save time
- Geography: Global, but English-first

**Unique Angle:** Free doesn't mean cheap. The website needs to look expensive while preaching the "free forever" message.

---

## 🔬 Research Findings

### Competitive Websites Analyzed

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| WhisperFlow | Clean, modern, trust badges | Generic SaaS template feel |
| Otter.ai | Great social proof, testimonials | Cluttered, too much text |
| Descript | Bold, memorable, video-forward | Heavy, slow loading |
| Grammarly | Clear CTA, simple flow | Boring, corporate |

### Design Opportunities
1. **Japanese aesthetic** — "Koe" means voice in Japanese. Subtle Japanese design elements (minimalism, negative space, brush strokes) could differentiate
2. **Dark mode premium** — Voice apps often used in "flow state" — dark UI feels more immersive
3. **Live demo feel** — Show the app in action, not just screenshots
4. **Anti-subscription messaging** — Bold "FREE" messaging as a feature, not a compromise

---

## 🏗️ Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | SEO-critical for marketing, fast loads, SSG for performance |
| **Styling** | Tailwind CSS v4 | Utility-first, design tokens easy to maintain |
| **Animations** | Framer Motion | Scroll-triggered reveals, micro-interactions, gesture support |
| **Typography** | Geist + Geist Mono + Noto Serif JP | Modern, technical, subtle Japanese character |
| **Color Theme** | Deep obsidian + Warm amber + Muted stone | Premium dark mode, voice/warmth metaphor |
| **Icons** | Lucide React | Consistent, lightweight |
| **Deployment** | Vercel | Edge network, perfect for Next.js, custom domain support |

---

## 🎨 Design Direction

### Aesthetic: "Cyber-Minimalist with Japanese Soul"

**Core Visual Language:**
- **Dark foundation:** Almost-black backgrounds (#0a0a0f) with subtle noise texture
- **Voice visualization:** Animated waveform/audio visualizer as hero element
- **Japanese minimalism:** Generous whitespace, intentional asymmetry, brush-stroke accents
- **Premium finishes:** Glassmorphism cards, subtle glows, refined shadows

**Key Visual Elements:**
1. **Hero Section:** Large animated waveform that responds to scroll, "Koe" in massive type with Japanese characters (声) as accent
2. **Feature Cards:** Glassmorphism with amber glow borders on hover
3. **App Screenshot:** Floating device mockup with the pill UI visible
4. **Comparison Table:** Koe vs WhisperFlow side-by-side
5. **Download Section:** Bold CTA with Windows badge

### Color Palette
```css
--background: #0a0a0f       /* Deep obsidian */
--foreground: #f8fafc       /* Off-white */
--muted: #27272a            /* Muted zinc */
--accent: #f59e0b           /* Warm amber */
--accent-glow: rgba(245, 158, 11, 0.3)
--secondary: #06b6d4        /* Cyan for tech feel */
--border: rgba(255,255,255,0.08)
```

---

## 📋 Feature Scope (MoSCoW)

### MUST HAVE (Ship-blocking)

| ID | Feature | Description |
|----|---------|-------------|
| FR-001 | **Hero Section** | Animated waveform, headline "Your Voice, Anywhere", subheadline, download CTA |
| FR-002 | **Value Proposition** | 3-column grid: Lightning Fast, Privacy First, Completely Free |
| FR-003 | **Feature Showcase** | Scroll-triggered sections: Global Hotkey, AI Transcription, Auto-Type, History |
| FR-004 | **Comparison Section** | Koe vs WhisperFlow table highlighting FREE vs $8/mo |
| FR-005 | **Download CTA** | Windows download button, version number, system requirements |
| FR-006 | **FAQ Section** | Accordion with common questions (API key, privacy, Windows version) |
| FR-007 | **Footer** | Links, GitHub, copyright, J StaR Films branding |
| FR-008 | **SEO Meta Tags** | Title, description, Open Graph, Twitter Cards |
| FR-009 | **Responsive Design** | Mobile, tablet, desktop breakpoints |
| FR-010 | **Performance** | <3s LCP, 90+ Lighthouse performance score |

### SHOULD HAVE (Important)

| ID | Feature | Description |
|----|---------|-------------|
| FR-011 | **Demo Video/GIF** | Auto-playing silent demo of Koe in action |
| FR-012 | **Testimonials** | User quotes (can use placeholders initially) |
| FR-013 | **Stats Counter** | "100% Free", "8+ Hours Daily", "100+ Languages" |
| FR-014 | **GitHub Star Button** | Link to repo with star count |
| FR-015 | **Newsletter Signup** | For updates (optional, low priority) |

### WON'T HAVE (V1)

- Payment processing (it's free!)
- User accounts/login
- Team/collaboration features page
- Documentation site (link to GitHub README)

---

## 🚀 Execution Strategy

### Recommended Workflow Chain
1. `/vibe-genesis` — Generate PRD, issues, guidelines
2. `/vibe-design` — Design system + page mockups
3. `/vibe-build` — Scaffold and implement
4. `/vibe-finalize` — Verify and ship

### Relevant Skills for Sub-Agents

| Skill | Why It's Relevant | Used By |
|-------|-------------------|---------|
| `frontend-design` | Bold, non-generic aesthetic | All design tasks |
| `ui-ux-pro-max` | Animation patterns, color palettes | Design system tasks |
| `seo-ready` | Meta tags, structured data, performance | Finalization tasks |
| `nextjs-standards` | Next.js 15 App Router patterns | Build tasks |

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Over-designing | Medium | Stick to MoSCoW, iterate after launch |
| Performance with animations | Medium | Use `will-change`, lazy load below-fold |
| Mobile experience | Medium | Design mobile-first, test early |

---

## 📝 Content Outline

### Hero
- **Headline:** "Your Voice, Anywhere."
- **Subheadline:** "Lightning-fast voice dictation for Windows. Free forever."
- **CTA:** "Download for Windows" (v1.0.0)

### Key Messaging
- **Free Forever:** "No subscriptions. No limits. Just your voice."
- **Privacy:** "Your voice never leaves your machine until you speak."
- **Speed:** "216x real-time transcription. It's basically instant."
- **Universal:** "Works in every app. Notion, VS Code, Chrome, Word — everywhere."

---

## ✅ Approval Checklist

- [x] Tech stack approved — Next.js 15 + Tailwind + Framer Motion
- [x] Design direction approved — Cyber-minimalist with Japanese soul
- [x] Feature scope approved — 10 MUST-HAVE, 5 SHOULD-HAVE
- [x] Domain confirmed — koe.jstarstudios.com
- [x] Deployment target — Vercel

---

*Generated by vibe-visionary mode for koe.jstarstudios.com*
