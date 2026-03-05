# Download Page Feature Blueprint

## Goal
Improve the `app/download/page.tsx` UI to align perfectly with the "Terminal Noir" aesthetic defined in `docs/DESIGN.md`. Ensure the layout maintains the data requested in `docs/PRD.md` but is wrapped in a highly brutalist, high-contrast, terminal-inspired style.

## Client vs Server
- The page itself will remain heavily RSC (React Server Component) except for client-bound specific pieces (like `lucide-react` icons rendering or `DownloadButton` tracking state).
- The `DownloadButton` is `"use client"` as it handles its own data fetching from the GitHub release.

## Data Flow
- DownloadButton queries `https://api.github.com/repos/JStaRFilms/Koe/releases/latest`.
- UI uses static content arrays defining steps and requirements.

## Visual Upgrades Outline
- Apply `btn-brutal` class globally for Download buttons.
- Giant Kanji background (`.giant-kanji`).
- `.grid-bg` under container elements to simulate terminal canvas spacing.
- Raw CSS borders (`border-raw`) instead of shaded Tailwind borders.
- Monospace wrapping for procedural steps e.g. `[01]` instead of `01`. 
- `crt-flicker` effects on headers.
