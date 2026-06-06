# Feature Spec: Pricing Page Redesign

## Goal
Redesign the Koe pricing page (`http://localhost:3001/pricing/`) to resolve layout squeezing and styling issues. Avoid 5 squished columns by creating a beautiful 2-column layout representing the core philosophy:
1. **BYOK (Bring Your Own Key)** - 100% Free developer route.
2. **Managed Cloud Processing** - Seamless, no-setup route, with interactive sub-tiers.

## Components

### Server Component
- [page.tsx](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-02-28_whisper_alt-V2/koe-website/app/pricing/page.tsx): The main entry page. It will remain a React Server Component (RSC) to handle page metadata and SEO. It will import and render the client-side `<PricingSection />`.

### Client Component
- [PricingSection.tsx](file:///c:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-02-28_whisper_alt-V2/koe-website/components/sections/PricingSection.tsx): Handles interactive tier selection for the Managed Cloud plans.
  - Tab Switcher state (`activeTab` = "Starter" | "Lite" | "Plus" | "Pro").
  - Dynamically updates price, eyebrow, description, features, and CTA for the active managed plan.
  - Brutalist theme alignment (Noir base, border-zinc, hover effects, amber accents).

## Data Flow
- Standard JSON tiers data is defined in `page.tsx` or `PricingSection.tsx`.
- User interactive clicks update client React state `activeTab`.
- No database write/read queries are required for this page.

## Layout Draft
- Two columns on desktop:
  - **BYOK Card** (Left): Prominent, static free tier.
  - **Managed Card** (Right): Interactive container with selector tabs at the top, followed by dynamic price/feature display.
- One column on mobile.
