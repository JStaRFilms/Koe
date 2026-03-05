# Vision Brief: Koe Marketing Website

**Visionary Session:** 2026-03-04  
**Status:** Awaiting Approval  
**Confidence Level:** High  
**Product:** Koe (声) — Voice Dictation Desktop App

---

## 🎯 The Idea

**One-liner:** A professional, conversion-optimized marketing website for Koe — the free, open-source, privacy-first voice dictation app.

**Problem it solves:** Most voice dictation tools (like WhisperFlow at $12+/mo) require expensive subscriptions. Koe provides the same high-quality transcription + AI enhancement completely free by using a BYOK (Bring Your Own Key) model with Groq's API.

**Target User:** 
- Primary: Windows power users, developers, writers, students
- Secondary: Privacy-conscious professionals, open-source enthusiasts
- Geography: Global, with focus on English-speaking markets initially

**Unique Angle:**
- **100% Free Forever** — No subscription, no hidden costs
- **Privacy-First** — Local VAD processing, no audio stored
- **Open Source** — Transparent, community-driven
- **BYOK Model** — Users bring their own Groq API key (free tier = 8 hours/day)

---

## 🔬 Research Findings

### Competitive Landscape

**WhisperFlow ($12+/mo)**
- Beautiful, modern design with cream/off-white aesthetic
- Strong feature demos with animated UI mockups
- Freemium model (2,000 words/week free tier)
- Heavy emphasis on AI Auto-Edits and tone adjustment
- Weakness: Subscription fatigue, vendor lock-in

**Built-in OS Dictation**
- Free but poor accuracy
- No AI enhancement
- Limited platform integration

**Koe's Market Opportunity:**
- Position as the "honest" alternative — no subscriptions, no lock-in
- Target users frustrated with SaaS pricing
- Appeal to privacy-conscious and open-source communities

### Technical Feasibility

**External Services Needed:**
- None for the website itself (static site)
- GitHub API (optional): For star count, release info
- Groq API (for future: live demo if we add one)

**Key Technical Considerations:**
- Website must be fast, SEO-optimized
- Download links must auto-detect latest release from GitHub
- Demo section could use embedded video or interactive component

### Proven Patterns from Research

1. **Hero Section:** Large typography, clear value prop, dual CTAs (Try Demo + Download)
2. **Feature Sections:** Visual demos with animated UI mockups
3. **Social Proof:** Company logos, testimonials with stats
4. **Comparison Table:** Clear differentiation from competitors
5. **Pricing:** Even for free products, show "pricing" to emphasize value
6. **Sticky CTA:** Download button follows user as they scroll

---

## 🏗️ Architecture Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | SEO-critical marketing site, fast static export |
| **Language** | TypeScript | Type safety for maintainability |
| **Styling** | Tailwind CSS v4 | Rapid development, consistent design system |
| **UI Components** | shadcn/ui | Production-ready, accessible components |
| **Animations** | Framer Motion | Smooth, professional animations |
| **Icons** | Lucide React | Consistent, lightweight icon set |
| **Deployment** | Vercel | Optimal for Next.js, automatic previews |
| **Domain** | `koe.jstarstudios.com` | User's specified subdomain |

### Project Structure

```
website/
├── app/
│   ├── page.tsx              # Landing page
│   ├── pricing/
│   │   └── page.tsx          # Pricing page (show "Free" prominently)
│   ├── download/
│   │   └── page.tsx          # Download page with latest release
│   └── layout.tsx            # Root layout with metadata
├── components/
│   ├── sections/             # Page sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Comparison.tsx
│   │   ├── Testimonials.tsx
│   │   └── CTA.tsx
│   ├── ui/                   # shadcn components
│   ├── DemoPlayer.tsx        # Demo video/component
│   └── DownloadButton.tsx    # Smart download button
├── lib/
│   └── github.ts             # GitHub API helpers
├── public/
│   ├── images/               # Screenshots, mockups
│   └── demo/                 # Demo video files
└── next.config.js
```

---

## 📋 Feature Scope (MoSCoW)

### MUST HAVE (Ship-blocking)

| ID | Feature | Description | Acceptance Criteria |
|----|---------|-------------|---------------------|
| **FR-001** | Hero Section | Bold headline, subheadline, dual CTAs | "Free Voice Dictation" messaging clear, Download + Demo CTAs visible |
| **FR-002** | Download Integration | Auto-detect latest GitHub release | Button links to latest `.exe`, shows version number |
| **FR-003** | Features Section | 3-4 key features with visuals | Visual mockups/screenshots of: Global Hotkey, AI Enhancement, Privacy-First, History |
| **FR-004** | Comparison Table | Koe vs WhisperFlow vs OS Dictation | Clear table showing Koe wins on cost + privacy |
| **FR-005** | GitHub Link | Prominent link to repository | CTA to "Star on GitHub" in nav and footer |
| **FR-006** | Responsive Design | Mobile, tablet, desktop layouts | All sections readable on all screen sizes |
| **FR-007** | SEO Metadata | Title, description, OG tags | Proper meta tags for social sharing |
| **FR-008** | Privacy Page | Privacy policy page | Static page explaining data practices |

### SHOULD HAVE (Important but not blocking)

| ID | Feature | Description |
|----|---------|-------------|
| **FR-009** | Demo Video/GIF | Auto-playing demo of app in action | 
| **FR-010** | Testimonials Section | User quotes with avatars |
| **FR-011** | FAQ Section | Common questions answered |
| **FR-012** | Open Source CTA | Section encouraging contributions |
| **FR-013** | Setup Guide | Brief "How to Get Started" steps |

### COULD HAVE (Nice-to-have)

| ID | Feature | Description |
|----|---------|-------------|
| **FR-014** | Interactive Demo | Try the transcription live on the site |
| **FR-015** | Analytics Dashboard | Show download counts, GitHub stars |
| **FR-016** | Multi-language | i18n support for other languages |
| **FR-017** | Blog Section | For updates and tutorials |

### WON'T HAVE (V1)

| Feature | Reason |
|---------|--------|
| User accounts/auth | Not needed for a download page |
| Payment integration | Product is free |
| Newsletter signup | Can add later if needed |
| Complex animations | Keep it fast and simple |

---

## 🎨 Design Direction

### Visual Identity

**Aesthetic:** Clean, modern, developer-friendly but accessible to all users

**Color Palette:**
- Primary: Deep teal/slate (`#0f172a`) — professional, trustworthy
- Accent: Warm amber (`#f59e0b`) — energy, voice, warmth
- Background: Off-white/cream (`#fafaf9`) — easy on eyes
- Success: Emerald (`#10b981`) — free, open source

**Typography:**
- Headings: Inter (bold, clean)
- Body: Inter or Geist (readable)
- Accent: JetBrains Mono (for code/tech elements)

**Key Design Elements:**
1. **Waveform Animations** — Subtle audio waveforms as decorative elements
2. **Glassmorphism Cards** — For feature highlights (like Koe's pill UI)
3. **Keyboard Shortcut Badges** — Visual `Ctrl + Shift + Space` badges
4. **Dark Mode Toggle** — Match Koe app's theme capability

### Page Layout

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

---

## 💰 Monetization Strategy

**Model:** Completely Free (Open Source)

**Value Proposition:**
- Users bring their own Groq API key
- Free tier: 8 hours of audio/day (20 RPM, 2K RPD)
- Optional: Link to Groq's paid tier for higher limits

**Revenue Opportunities (Future):**
- GitHub Sponsors for donations
- Optional cloud service (v2.0+)
- Team/Enterprise features (future)

---

## 🚀 Execution Strategy

### Recommended Workflow Chain

1. **`/vibe-genesis`** — Generate PRD, issues, coding guidelines
2. **`/vibe-design`** — Create DESIGN.md with full design system
3. **`/vibe-build`** — Scaffold Next.js project, implement all MUST-HAVE features
4. **`/vibe-finalize`** — SEO audit, performance optimization, deploy

### Relevant Skills for Sub-Agents

| Skill | Why It's Relevant | Used By |
|-------|-------------------|---------|
| `nextjs-standards` | Critical for Next.js 15 App Router compliance | All build tasks |
| `frontend-design` | For creating polished, non-generic UI | Design + build tasks |
| `seo-ready` | Marketing site needs SEO optimization | Finalization tasks |
| `ui-ux-pro-max` | Design guidelines and patterns | Design phase |

### Required Workflows

| Workflow | Purpose | Phase |
|----------|---------|-------|
| `/vibe-primeAgent` | Load project context | Every task |
| `/vibe-build` | Scaffold + implement | Build phase |
| `/vibe-finalize` | Verify + ship | Final phase |

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Likigation |
|------|--------|------------|
| GitHub API rate limits | Low | Cache release info, fallback to manual version |
| Download links breaking | Medium | Validate links before deployment, provide manual fallback |
| Demo video too large | Low | Use compressed MP4, lazy load, or GIF alternative |
| Mobile layout issues | Medium | Thorough responsive testing |
| SEO not ranking | Medium | Proper meta tags, sitemap, fast Core Web Vitals |

---

## 📊 Data Model

Not applicable for static marketing site. If adding analytics later:

```typescript
// Download tracking (anonymous)
interface DownloadEvent {
  version: string;
  timestamp: Date;
  referrer: string;
  os: 'windows'; // Future: 'mac' | 'linux'
}
```

---

## ✅ Approval Checklist

Before handing to Orchestrator, user must confirm:

- [ ] **Tech stack approved:** Next.js 15 + Tailwind + shadcn/ui + Vercel
- [ ] **Feature scope approved:** 8 MUST-HAVE, 5 SHOULD-HAVE features
- [ ] **Design direction approved:** Teal/amber palette, developer-friendly aesthetic
- [ ] **Monetization approach:** Free/open source model
- [ ] **Domain strategy:** Custom domain or Vercel subdomain

---

## 📄 Deliverables

After orchestration completes, you will have:

1. **Fully functional Next.js website** deployed to Vercel
2. **All MUST-HAVE features** implemented and tested
3. **SEO optimization** (meta tags, sitemap, structured data)
4. **Performance optimized** (Lighthouse score 90+)
5. **Responsive design** working on all devices
6. **Download integration** auto-linking to latest GitHub release

---

*Generated by 👁️ Vibe Visionary mode*
