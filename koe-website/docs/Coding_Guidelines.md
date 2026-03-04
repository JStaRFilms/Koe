# Coding Guidelines
# Koe Marketing Website

**Project:** koe.jstarstudios.com  
**Framework:** Next.js 15 (App Router)  
**Styling:** Tailwind CSS v4  
**UI Library:** shadcn/ui  
**Date:** 2026-03-04

---

## 1. Project Structure

### 1.1 Directory Layout
```
koe-website/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   ├── privacy/
│   │   └── page.tsx             # Privacy policy page
│   ├── api/
│   │   └── github/
│   │       └── route.ts         # GitHub API proxy
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── navigation.tsx
│   └── sections/                # Page sections
│       ├── hero.tsx
│       ├── features.tsx
│       ├── showcase.tsx
│       ├── comparison.tsx
│       ├── faq.tsx
│       └── github-cta.tsx
├── hooks/                       # Custom React hooks
│   └── use-github.ts
├── lib/                         # Utilities
│   ├── utils.ts                 # shadcn utils (cn)
│   └── github.ts                # GitHub API helpers
├── types/                       # TypeScript types
│   └── index.ts
├── public/                      # Static assets
│   ├── images/
│   │   ├── hero-waveform.svg
│   │   ├── screenshot-settings.png
│   │   ├── screenshot-pill.png
│   │   └── screenshot-history.png
│   └── favicon.ico
├── docs/                        # Documentation
│   ├── PRD.md
│   └── Coding_Guidelines.md
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 1.2 File Naming Conventions
| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `HeroSection.tsx` |
| Pages | page.tsx (Next.js convention) | `app/page.tsx` |
| Hooks | camelCase with `use` prefix | `useGitHub.ts` |
| Utils | camelCase | `githubApi.ts` |
| Types | PascalCase | `GitHubRelease.ts` |
| Styles | kebab-case | `globals.css` |

---

## 2. Component Standards

### 2.1 Component Structure
```typescript
// components/sections/hero.tsx
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeroSectionProps {
  version: string;
  downloadUrl: string;
}

export function HeroSection({ version, downloadUrl }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center">
      {/* Component content */}
    </section>
  );
}
```

### 2.2 Component Rules
1. **200-Line Limit:** Refactor if a component exceeds 200 lines
2. **Single Responsibility:** One component = one purpose
3. **Props Interface:** Always define TypeScript interface for props
4. **Default Exports:** Avoid default exports; use named exports
5. **Client Components:** Only add `'use client'` when necessary (interactivity, hooks, browser APIs)

### 2.3 Server vs Client Components
| Use Server Component | Use Client Component |
|---------------------|---------------------|
| Static content | Interactive elements |
| Data fetching | `useState`, `useEffect` |
| SEO-critical content | Browser APIs (window, document) |
| No event handlers | Event handlers (onClick, onSubmit) |

```typescript
// Server Component (default)
export function FeaturesSection() {
  return <section>{/* Static content */}</section>;
}

// Client Component (only when needed)
'use client';

export function AnimatedCounter() {
  const [count, setCount] = useState(0);
  // ... interactive logic
}
```

---

## 3. Styling Standards

### 3.1 Tailwind CSS v4
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: #0a0a0f;
  --color-foreground: #f8fafc;
  --color-muted: #27272a;
  --color-accent: #f59e0b;
  --color-accent-glow: rgba(245, 158, 11, 0.3);
  --color-secondary: #06b6d4;
  --color-border: rgba(255, 255, 255, 0.08);
}
```

### 3.2 Utility-First Approach
- **DO:** Use Tailwind utility classes
- **DON'T:** Create custom CSS files
- **Exception:** Complex animations in CSS modules

```typescript
// ✅ Good
<button className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-accent/90 transition-colors">
  Download
</button>

// ❌ Bad
<button className="download-btn">Download</button>
// With separate .css file
```

### 3.3 Class Name Ordering
Follow this order for consistency:
1. Layout (`flex`, `grid`, `block`)
2. Positioning (`relative`, `absolute`)
3. Sizing (`w-full`, `h-screen`)
4. Spacing (`px-4`, `my-2`)
5. Colors (`bg-background`, `text-foreground`)
6. Typography (`text-lg`, `font-bold`)
7. Effects (`shadow-lg`, `rounded-md`)
8. States (`hover:`, `focus:`, `disabled:`)
9. Responsive (`sm:`, `md:`, `lg:`)

### 3.4 Using the `cn()` Utility
```typescript
import { cn } from "@/lib/utils";

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Button({ variant = 'primary', size = 'md', className }: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        "rounded-lg font-medium transition-colors",
        // Variant styles
        variant === 'primary' && "bg-accent text-background hover:bg-accent/90",
        variant === 'secondary' && "bg-muted text-foreground hover:bg-muted/80",
        // Size styles
        size === 'sm' && "px-3 py-1.5 text-sm",
        size === 'md' && "px-4 py-2 text-base",
        size === 'lg' && "px-6 py-3 text-lg",
        // Custom classes (must be last)
        className
      )}
    >
      Click me
    </button>
  );
}
```

---

## 4. shadcn/ui Standards

### 4.1 Installation
```bash
npx shadcn add button
npx shadcn add card
npx shadcn add accordion
```

### 4.2 Component Customization
Customize shadcn components via:
1. **Theme variables** in `globals.css` (preferred)
2. **Component props** (size, variant)
3. **ClassName override** using `cn()`

```typescript
// Override styles via className
<Button 
  variant="default" 
  className="bg-accent hover:bg-accent/90"
>
  Download
</Button>
```

### 4.3 Available Components
| Component | Purpose | Install Command |
|-----------|---------|-----------------|
| Button | CTAs, actions | `npx shadcn add button` |
| Card | Feature cards | `npx shadcn add card` |
| Accordion | FAQ section | `npx shadcn add accordion` |
| Badge | Version tags | `npx shadcn add badge` |
| Skeleton | Loading states | `npx shadcn add skeleton` |
| Separator | Visual dividers | `npx shadcn add separator` |

---

## 5. Animation Standards

### 5.1 Framer Motion Guidelines
```typescript
import { motion } from "framer-motion";

// Fade in on scroll
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  Content
</motion.div>

// Stagger children
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" whileInView="show">
  {items.map(i => <motion.div key={i} variants={item} />)}
</motion.div>
```

### 5.2 Performance Best Practices
- Use `transform` and `opacity` only (GPU-accelerated)
- Add `will-change` sparingly
- Use `viewport={{ once: true }}` to animate only once
- Implement `prefers-reduced-motion` support

```typescript
// Respect user's motion preferences
const prefersReducedMotion = 
  typeof window !== 'undefined' && 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={prefersReducedMotion ? {} : { opacity: 1 }}
>
```

---

## 6. Data Fetching

### 6.1 GitHub API Integration
```typescript
// lib/github.ts
export interface GitHubRelease {
  tag_name: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export async function getLatestRelease(): Promise<GitHubRelease> {
  const res = await fetch(
    'https://api.github.com/repos/GIGAHAT1994/whisper_alt/releases/latest',
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch release');
  }
  
  return res.json();
}

export async function getRepoStars(): Promise<number> {
  const res = await fetch(
    'https://api.github.com/repos/GIGAHAT1994/whisper_alt',
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch repo');
  }
  
  const data = await res.json();
  return data.stargazers_count;
}
```

### 6.2 Error Handling
```typescript
// hooks/use-github.ts
'use client';

import { useState, useEffect } from 'react';

export function useGitHubRelease() {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/api/github/release')
      .then(res => res.json())
      .then(data => {
        setRelease(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { release, loading, error };
}
```

---

## 7. SEO & Metadata

### 7.1 Next.js Metadata API
```typescript
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Koe — Free Voice Dictation for Windows",
  description: "Lightning-fast, free voice dictation app for Windows. Powered by AI, completely open source.",
  keywords: ["voice dictation", "speech to text", "Windows", "free", "open source"],
  openGraph: {
    title: "Koe — Free Voice Dictation for Windows",
    description: "Lightning-fast, free voice dictation app for Windows.",
    url: "https://koe.jstarstudios.com",
    siteName: "Koe",
    images: [{
      url: "https://koe.jstarstudios.com/og-image.jpg",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koe — Free Voice Dictation for Windows",
    description: "Lightning-fast, free voice dictation app for Windows.",
    images: ["https://koe.jstarstudios.com/og-image.jpg"],
  },
};
```

### 7.2 Dynamic Metadata
```typescript
// app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Koe",
  description: "Koe's privacy policy - we don't collect any of your data.",
};
```

---

## 8. TypeScript Standards

### 8.1 Type Definitions
```typescript
// types/index.ts
export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface ComparisonItem {
  feature: string;
  koe: boolean | string;
  whisperflow: boolean | string;
  osDictation: boolean | string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
```

### 8.2 Type Safety Rules
1. **No `any`:** Use `unknown` if type is truly unknown
2. **Explicit Returns:** Always type function return values
3. **Strict Mode:** Enable `strict: true` in tsconfig.json

```typescript
// ✅ Good
function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

// ❌ Bad
function formatDate(date: any): any {
  return date.toLocaleDateString();
}
```

---

## 9. Accessibility Standards

### 9.1 Semantic HTML
```typescript
// ✅ Good
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/privacy">Privacy</a></li>
  </ul>
</nav>

<main>
  <section aria-labelledby="features-heading">
    <h2 id="features-heading">Features</h2>
    {/* content */}
  </section>
</main>

// ❌ Bad
<div className="nav">
  <div className="link">Home</div>
</div>
```

### 9.2 ARIA Labels
```typescript
// Icon-only buttons need labels
<button aria-label="Download Koe for Windows">
  <DownloadIcon />
</button>

// Links that open in new tab
<a 
  href="https://github.com/GIGAHAT1994/whisper_alt" 
  target="_blank" 
  rel="noopener noreferrer"
  aria-label="View Koe on GitHub (opens in new tab)"
>
  GitHub
</a>
```

### 9.3 Focus Management
- All interactive elements must be keyboard accessible
- Visible focus indicators (never remove focus styles)
- Logical tab order

---

## 10. Performance Guidelines

### 10.1 Image Optimization
```typescript
import Image from "next/image";

// ✅ Good
<Image
  src="/screenshot-settings.png"
  alt="Koe settings window"
  width={800}
  height={600}
  priority={false} // true only for above-fold images
  placeholder="blur"
/>

// ❌ Bad
<img src="/screenshot-settings.png" alt="Settings" />
```

### 10.2 Code Splitting
- Use dynamic imports for below-fold components
- Lazy load heavy animations

```typescript
import dynamic from "next/dynamic";

const HeavyAnimation = dynamic(
  () => import("@/components/heavy-animation"),
  { ssr: false, loading: () => <Skeleton /> }
);
```

---

## 11. Git Workflow

### 11.1 Commit Messages
```
feat: add hero section with animated waveform
fix: resolve mobile navigation overflow
docs: update PRD with new features
style: adjust spacing on feature cards
refactor: extract GitHub API to service layer
test: add unit tests for GitHub hooks
```

### 11.2 Branch Naming
- `feature/FR-001-hero-section`
- `fix/mobile-navigation`
- `docs/update-guidelines`

---

## 12. Verification Checklist

Before marking any task complete:

- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] All acceptance criteria from PRD are met
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Accessibility checks pass (keyboard nav, ARIA labels)
- [ ] No console errors or warnings
- [ ] Images optimized and lazy-loaded
- [ ] Animations respect `prefers-reduced-motion`

---

*These guidelines ensure consistency and quality across the Koe marketing website project.*
