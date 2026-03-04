# Product Requirements Document (PRD)
# Koe Marketing Website

**Project:** koe.jstarstudios.com  
**Version:** 1.0  
**Date:** 2026-03-04  
**Status:** Draft  

---

## 1. Executive Summary

### 1.1 Product Overview
Koe (声) is a free, open-source voice dictation app for Windows. This marketing website converts visitors into downloads by showcasing its unique value proposition: completely free voice dictation powered by the user's own Groq API key (BYOK model).

### 1.2 Target Audience
- **Primary:** Developers, writers, productivity enthusiasts on Windows
- **Secondary:** Anyone who types a lot and wants to save time
- **Geography:** Global, English-first

### 1.3 Key Differentiators
| Competitor | Cost | Koe Advantage |
|------------|------|---------------|
| WhisperFlow | $8-12/month | 100% Free Forever |
| Built-in OS Dictation | Free | Superior accuracy, universal app support |
| Otter.ai | $10-20/month | Privacy-first, no cloud storage |

### 1.4 Success Metrics
- **Primary:** Download conversion rate > 5%
- **Secondary:** Time on page > 2 minutes, bounce rate < 40%
- **Performance:** Lighthouse score > 90, LCP < 3s

---

## 2. Technical Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | 15.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | Latest |
| Animations | Framer Motion | 11.x |
| Icons | Lucide React | Latest |
| Deployment | Vercel | Edge Network |

---

## 3. Feature Requirements

### FR-001: Hero Section

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Bold, immersive hero section that immediately communicates Koe's value proposition and converts visitors.

#### Requirements
- **Headline:** "Your Voice, Anywhere" (large, animated text)
- **Subheadline:** "Lightning-fast voice dictation for Windows. Free forever."
- **Japanese Accent:** Display "声" (voice) character as design element
- **Animated Waveform:** Visual audio wave that responds to scroll/mouse
- **Primary CTA:** "Download for Windows" button (links to GitHub release)
- **Secondary CTA:** "View on GitHub" link
- **Version Badge:** Display latest version number (e.g., "v1.0.0")

#### Acceptance Criteria
- [ ] Hero renders correctly on mobile, tablet, and desktop
- [ ] Waveform animation plays smoothly (60fps)
- [ ] CTAs are visually prominent and accessible
- [ ] Version number is dynamically fetched from GitHub API
- [ ] Page loads with LCP < 3 seconds for hero content

#### Technical Notes
- Use Framer Motion for scroll-triggered animations
- Waveform can be CSS-based or canvas-based (performance priority)
- Implement `prefers-reduced-motion` fallback

---

### FR-002: Download Integration

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Automatic integration with GitHub releases to always point to the latest version.

#### Requirements
- **Auto-Detect:** Fetch latest release from GitHub API
- **Direct Link:** Primary button links to `.exe` asset
- **Version Display:** Show current version number
- **Release Date:** Show "Released X days ago"
- **Fallback:** Manual link to releases page if API fails

#### Acceptance Criteria
- [ ] GitHub API integration fetches latest release data
- [ ] Download button links directly to `.exe` file
- [ ] Version number displays correctly
- [ ] Loading state shown while fetching
- [ ] Error state with fallback link if API fails
- [ ] Button is Windows-focused (no macOS/Linux confusion)

#### Technical Notes
```typescript
// GitHub API endpoint
// GET https://api.github.com/repos/GIGAHAT1994/whisper_alt/releases/latest
// Response: { tag_name, assets: [{ name, browser_download_url }] }
```

---

### FR-003: Features Section

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
3-column grid showcasing the 3 key value propositions of Koe.

#### Requirements
- **Feature 1: Lightning Fast**
  - Icon: Zap
  - Title: "Lightning Fast"
  - Description: "216x real-time transcription. It's basically instant."
  
- **Feature 2: Privacy First**
  - Icon: Shield
  - Title: "Privacy First"
  - Description: "Local VAD processing. Your voice never leaves your machine until you choose to send it."
  
- **Feature 3: Completely Free**
  - Icon: Gift
  - Title: "Completely Free"
  - Description: "No subscriptions. No limits. Just your voice, transcribed."

#### Acceptance Criteria
- [ ] 3-column grid on desktop, stacks on mobile
- [ ] Icons are consistent size and style (Lucide)
- [ ] Scroll-triggered fade-in animation
- [ ] Each feature card has hover state
- [ ] Text is readable with proper contrast

#### Technical Notes
- Use CSS Grid with responsive breakpoints
- Implement intersection observer for scroll animations
- Cards should use consistent padding and border-radius

---

### FR-004: Feature Showcase

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Detailed feature sections with app screenshots/mockups demonstrating key capabilities.

#### Requirements
- **Section 1: Global Hotkey**
  - Screenshot: Settings window showing hotkey configuration
  - Title: "Your Shortcut to Productivity"
  - Description: "Configure any hotkey combo. Press it anywhere, start dictating."

- **Section 2: AI Transcription**
  - Visual: Animated waveform or pill UI mockup
  - Title: "Powered by Groq AI"
  - Description: "Bring your own API key for lightning-fast Whisper transcription."

- **Section 3: Auto-Type**
  - Screenshot: Demo of text appearing in an app
  - Title: "Works Everywhere"
  - Description: "Notion, VS Code, Chrome, Word — Koe types wherever your cursor is."

- **Section 4: History**
  - Screenshot: History panel showing past transcriptions
  - Title: "Never Lose a Thought"
  - Description: "Automatic history saves every transcription. Copy, retry, or delete anytime."

#### Acceptance Criteria
- [ ] Alternating layout (image left/right) for visual interest
- [ ] Each section has screenshot or mockup
- [ ] Smooth scroll-triggered reveal animations
- [ ] Images are optimized (WebP format, lazy loaded)
- [ ] Mobile: stacked layout with image above text

#### Technical Notes
- Use Next.js Image component for optimization
- Implement blur placeholder for images
- Consider using Framer Motion's `whileInView` for animations

---

### FR-005: Comparison Table

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Side-by-side comparison showing Koe's advantages over competitors.

#### Requirements
| Feature | Koe | WhisperFlow | OS Dictation |
|---------|-----|-------------|--------------|
| Cost | Free Forever | $8-12/mo | Free |
| Accuracy | High (Whisper) | High (Whisper) | Low-Medium |
| Privacy | Local VAD | Cloud | Local |
| Universal | All apps | All apps | Limited |
| Open Source | Yes | No | No |
| Hotkey | Customizable | Fixed | Fixed |
| History | Yes | Limited | No |

#### Acceptance Criteria
- [ ] Table clearly highlights Koe advantages
- [ ] Checkmark/X icons for boolean features
- [ ] Responsive: horizontal scroll on mobile or card layout
- [ ] Koe column visually emphasized (different background/border)
- [ ] Prices are accurate and up-to-date

#### Technical Notes
- Consider using shadcn/ui Table component
- On mobile, may need to transform into stacked cards
- Ensure proper ARIA labels for accessibility

---

### FR-006: GitHub Integration

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Prominent GitHub presence to build trust and encourage stars/contributions.

#### Requirements
- **Hero GitHub Link:** Secondary CTA in hero
- **Star Count Badge:** Display current GitHub star count
- **Footer GitHub Link:** Icon link in footer
- **Contribute CTA:** "Star us on GitHub" button

#### Acceptance Criteria
- [ ] GitHub star count fetches from API and displays
- [ ] Multiple entry points to GitHub repo
- [ ] Star button is clickable and opens repo
- [ ] Loading state for star count
- [ ] Error handling if API fails

#### Technical Notes
```typescript
// GitHub API for stars
// GET https://api.github.com/repos/GIGAHAT1994/whisper_alt
// Response: { stargazers_count }
```

---

### FR-007: SEO Metadata

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Complete SEO setup for search engine visibility and social sharing.

#### Requirements
- **Title:** "Koe — Free Voice Dictation for Windows"
- **Description:** "Lightning-fast, free voice dictation app for Windows. Powered by AI, completely open source. No subscriptions, just your voice."
- **Keywords:** voice dictation, speech to text, Windows, free, open source, Whisper
- **Open Graph:**
  - og:title
  - og:description
  - og:image (1200x630)
  - og:url
  - og:type: website
- **Twitter Cards:**
  - twitter:card: summary_large_image
  - twitter:title
  - twitter:description
  - twitter:image
- **Canonical URL:** https://koe.jstarstudios.com
- **Favicon:** Multi-size favicon set

#### Acceptance Criteria
- [ ] All meta tags render in `<head>`
- [ ] Open Graph image is 1200x630px
- [ ] Twitter Card validates with Twitter validator
- [ ] Favicon displays on all devices/browsers
- [ ] robots.txt allows indexing
- [ ] sitemap.xml generated

#### Technical Notes
- Use Next.js 15 Metadata API
- OG image can be static or dynamically generated
- Test with Facebook Sharing Debugger and Twitter Card Validator

---

### FR-008: Privacy Page

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Dedicated privacy policy page explaining data practices.

#### Requirements
- **URL:** `/privacy`
- **Sections:**
  1. **Overview:** Brief statement about privacy commitment
  2. **What We Collect:** "We don't collect anything. Koe is completely local."
  3. **API Key Storage:** Explain local-only storage of Groq API key
  4. **Audio Processing:** Local VAD, optional cloud transcription via Groq
  5. **GitHub:** Link to open source repository for verification
  6. **Contact:** Link to GitHub issues for questions

#### Acceptance Criteria
- [ ] Page accessible at `/privacy`
- [ ] Content is clear and honest
- [ ] Link to privacy page in footer
- [ ] Page has proper SEO meta tags
- [ ] Content is comprehensive but concise

#### Technical Notes
- Create `app/privacy/page.tsx`
- Use semantic HTML (article, section, heading hierarchy)
- Include last updated date

---

### FR-009: Responsive Design

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Fully responsive layout supporting mobile, tablet, and desktop viewports.

#### Requirements
- **Mobile:** < 640px
  - Single column layout
  - Stacked navigation (hamburger menu)
  - Full-width CTAs
  - Touch-friendly tap targets (min 44px)
  
- **Tablet:** 640px - 1024px
  - 2-column grids where appropriate
  - Persistent navigation
  - Adjusted spacing
  
- **Desktop:** > 1024px
  - Full multi-column layouts
  - Maximum content width (1280px)
  - Hover states enabled

#### Acceptance Criteria
- [ ] Layout adapts correctly at all breakpoints
- [ ] No horizontal scrolling on any device
- [ ] Touch targets are minimum 44x44px on mobile
- [ ] Text is readable without zooming (16px minimum)
- [ ] Images scale appropriately
- [ ] Navigation is usable on all screen sizes

#### Technical Notes
- Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Use mobile-first approach
- Test on actual devices when possible

---

### FR-010: FAQ Section

**Priority:** P0 (Ship-blocking)  
**Status:** Not Started

#### Description
Accordion-style FAQ addressing common questions.

#### Requirements
- **Q1:** "Is Koe really free?"
  - A: "Yes, completely free and open source. No hidden costs, no subscriptions."
  
- **Q2:** "Do I need a Groq API key?"
  - A: "Yes, Koe uses a BYOK (Bring Your Own Key) model. Sign up at groq.com for a free API key."
  
- **Q3:** "Is my voice data private?"
  - A: "Absolutely. Voice Activity Detection happens locally on your machine. Audio is only sent to Groq for transcription when you explicitly trigger dictation."
  
- **Q4:** "What Windows versions are supported?"
  - A: "Koe works on Windows 10 and Windows 11."
  
- **Q5:** "Can I use Koe in any app?"
  - A: "Yes! Koe uses auto-type to insert text wherever your cursor is — Notion, VS Code, Chrome, Word, and more."

#### Acceptance Criteria
- [ ] Accordion expands/collapses smoothly
- [ ] Only one item open at a time (optional)
- [ ] Accessible with keyboard navigation
- [ ] Works on mobile (touch-friendly)
- [ ] Questions are actual user questions

#### Technical Notes
- Use shadcn/ui Accordion component
- Consider adding FAQ schema markup for SEO

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **LCP:** < 3 seconds
- **FID:** < 100ms
- **CLS:** < 0.1
- **Lighthouse Score:** > 90 (Performance)
- **Bundle Size:** < 200KB (initial JS)

### 4.2 Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML throughout
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratio > 4.5:1

### 4.3 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### 4.4 Security
- HTTPS only
- Content Security Policy headers
- No sensitive data in client-side code
- Secure external links (rel="noopener noreferrer")

---

## 5. Design System

### 5.1 Color Palette
```css
--background: #0a0a0f       /* Deep obsidian */
--foreground: #f8fafc       /* Off-white */
--muted: #27272a            /* Muted zinc */
--accent: #f59e0b           /* Warm amber */
--accent-glow: rgba(245, 158, 11, 0.3)
--secondary: #06b6d4        /* Cyan for tech feel */
--border: rgba(255,255,255,0.08)
```

### 5.2 Typography
- **Headings:** Geist, sans-serif
- **Body:** Geist, sans-serif
- **Japanese:** Noto Serif JP
- **Mono:** Geist Mono

### 5.3 Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

---

## 6. Appendix

### 6.1 GitHub Repository
- **URL:** https://github.com/GIGAHAT1994/whisper_alt
- **Releases:** https://github.com/GIGAHAT1994/whisper_alt/releases

### 6.2 Domain
- **Production:** https://koe.jstarstudios.com

### 6.3 Changelog
| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial PRD |
