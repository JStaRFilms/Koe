# Task: Phase 3B — Implement MUST-HAVE Features

**Session ID:** orch-20260304-183000  
**Source:** Vision Brief — Koe Marketing Website  
**Context:** Implementing all 8 MUST-HAVE features for the Koe marketing website  
**Priority:** P0 (Blocking)  
**Dependencies:** 03_scaffold (Project must be scaffolded)  
**Created At:** 2026-03-04

---

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> **Primary Workflow:** `/vibe-build`
>
> This workflow guides implementation of features.

### Required Skills
> **Inject these skills into your context:**
>
> | Skill | Path | Why |
> |-------|------|-----|
> | `nextjs-standards` | `C:/Users/johno/.kilocode/skills/nextjs-standards/SKILL.md` | Next.js 15 App Router compliance |
> | `frontend-design` | `C:/Users/johno/.kilocode/skills/frontend-design/SKILL.md` | Polished UI implementation |
> | `seo-ready` | `C:/Users/johno/.kilocode/skills/seo-ready/SKILL.md` | Marketing site SEO |

### Read First
> **MANDATORY:** Read these files before starting:
> - `koe-website/docs/PRD.md` (requirements)
> - `koe-website/docs/DESIGN.md` (design system)
> - `koe-website/docs/Mockup.md` (visual specifications)
> - `koe-website/docs/Coding_Guidelines.md`

---

## 📋 Objective

Implement all 8 MUST-HAVE features for the Koe marketing website:
1. Hero Section (FR-001)
2. Download Integration (FR-002)
3. Features Section (FR-003)
4. Comparison Table (FR-004)
5. GitHub Link (FR-005)
6. Responsive Design (FR-006)
7. SEO Metadata (FR-007)
8. Privacy Page (FR-008)

---

## 🎯 Scope

**In Scope — Implement All 8 Features:**

### FR-001: Hero Section
- [ ] Bold headline "Free Voice Dictation"
- [ ] Subheadline emphasizing value
- [ ] Dual CTAs: "Watch Demo" + "Download"
- [ ] Animated waveform background
- [ ] Trust badges (Free forever, Privacy-first)

### FR-002: Download Integration
- [ ] Smart download button component
- [ ] Auto-fetch latest release from GitHub API
- [ ] Cache release info to avoid rate limits
- [ ] Display version number
- [ ] Fallback to manual link if API fails

### FR-003: Features Section
- [ ] 4 feature cards with icons
- [ ] Global Hotkey feature
- [ ] AI Enhancement feature
- [ ] Privacy-First feature
- [ ] History feature
- [ ] Visual mockups for each

### FR-004: Comparison Table
- [ ] Table comparing Koe vs WhisperFlow vs OS Dictation
- [ ] Show Koe advantages: Free, Privacy-first, Open Source
- [ ] Clear visual hierarchy
- [ ] Responsive table design

### FR-005: GitHub Link
- [ ] "Star on GitHub" CTA in navigation
- [ ] GitHub link in footer
- [ ] Display star count (if possible)
- [ ] Link to: `https://github.com/JStaRFilms/Koe-------Voice-Dictation-Desktop-App`

### FR-006: Responsive Design
- [ ] Mobile layout (320px - 639px)
- [ ] Tablet layout (640px - 1023px)
- [ ] Desktop layout (1024px+)
- [ ] All sections readable on all sizes
- [ ] Touch-friendly interactions

### FR-007: SEO Metadata
- [ ] Title: "Koe (声) — Free Voice Dictation for Windows"
- [ ] Meta description
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Canonical URL
- [ ] Favicon

### FR-008: Privacy Page
- [ ] Static privacy policy page
- [ ] Explain data practices
- [ ] Local VAD processing explanation
- [ ] No audio storage policy
- [ ] Link in footer

**Out of Scope:**
- SHOULD-HAVE features (testimonials, FAQ, etc.)
- Interactive demos
- Analytics integration
- Blog section

---

## 📚 Context

### GitHub Repository
**URL:** `https://github.com/JStaRFilms/Koe-------Voice-Dictation-Desktop-App`

### API Integration

**GitHub API for Latest Release:**
```
GET https://api.github.com/repos/JStaRFilms/Koe-------Voice-Dictation-Desktop-App/releases/latest
```

**Response fields to use:**
- `tag_name` — Version number
- `assets[0].browser_download_url` — Download URL for .exe
- `published_at` — Release date

**Caching Strategy:**
- Cache release info in localStorage or memory
- Refresh every 1 hour
- Fallback to hardcoded URL if API fails

### Design Tokens

**Colors:**
- Primary: `#0f172a` (slate-900)
- Accent: `#f59e0b` (amber-500)
- Background: `#fafaf9` (stone-50)
- Success: `#10b981` (emerald-500)

**Typography:**
- Headings: Inter
- Body: Inter
- Code: JetBrains Mono

### Page Structure

```
Landing Page:
├── Navbar (sticky, with download button)
├── Hero Section
├── Social Proof Section
├── How It Works Section
├── Features Section
├── Comparison Section
├── Demo Section (placeholder/video)
├── CTA Section
└── Footer

Additional Pages:
├── /privacy — Privacy Policy
├── /download — Download page
└── /pricing — Pricing page (shows "Free")
```

---

## ✅ Definition of Done

- [ ] All 8 MUST-HAVE features implemented
- [ ] Hero section with animations and CTAs
- [ ] Download button fetches latest release
- [ ] Features section with 4 cards
- [ ] Comparison table implemented
- [ ] GitHub links working
- [ ] Responsive on all screen sizes
- [ ] SEO metadata on all pages
- [ ] Privacy page created
- [ ] TypeScript compiles without errors
- [ ] Build succeeds (`npm run build`)

---

## 📁 Expected Artifacts

| File | Purpose |
|------|---------|
| `website/app/page.tsx` | Landing page |
| `website/app/privacy/page.tsx` | Privacy policy |
| `website/app/download/page.tsx` | Download page |
| `website/app/pricing/page.tsx` | Pricing page |
| `website/app/layout.tsx` | Root layout with metadata |
| `website/components/sections/Hero.tsx` | Hero section |
| `website/components/sections/Features.tsx` | Features section |
| `website/components/sections/Comparison.tsx` | Comparison table |
| `website/components/sections/HowItWorks.tsx` | How it works |
| `website/components/Navbar.tsx` | Navigation |
| `website/components/Footer.tsx` | Footer |
| `website/components/DownloadButton.tsx` | Smart download button |
| `website/lib/github.ts` | GitHub API helpers |

---

## 🚫 Constraints

- Follow design system exactly (colors, spacing, typography)
- Use Framer Motion for animations
- Keep animations performant (transform/opacity only)
- Ensure 60fps on mobile
- All images must have alt text
- All links must be accessible
- Download must work on Windows (target audience)
- Handle GitHub API rate limits gracefully

---

**When Done:**
- Create `04_features.result.md` in the completed folder
- Include which workflow and skills you used
- Confirm all 8 features are working
- Signal completion with `attempt_completion` tool

---

*Generated by vibe-orchestrator mode*
