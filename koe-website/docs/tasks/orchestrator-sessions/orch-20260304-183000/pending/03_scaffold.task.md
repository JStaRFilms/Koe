# Task: Phase 3A — Scaffold Next.js Project

**Session ID:** orch-20260304-183000  
**Source:** Vision Brief — Koe Marketing Website  
**Context:** Setting up the foundational Next.js 15 project structure  
**Priority:** P0 (Blocking)  
**Dependencies:** 02_design (Design system must be complete)  
**Created At:** 2026-03-04

---

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
> **Primary Workflow:** `/vibe-build`
>
> This workflow guides project scaffolding and implementation.

### Required Skills
> **Inject these skills into your context:**
>
> | Skill | Path | Why |
> |-------|------|-----|
> | `nextjs-standards` | `C:/Users/johno/.kilocode/skills/nextjs-standards/SKILL.md` | Next.js 15 App Router compliance |
> | `frontend-design` | `C:/Users/johno/.kilocode/skills/frontend-design/SKILL.md` | Polished UI implementation |

### Read First
> **MANDATORY:** Read these files before starting:
> - `koe-website/docs/PRD.md` (from Phase 1)
> - `koe-website/docs/DESIGN.md` (from Phase 2)
> - `koe-website/docs/Coding_Guidelines.md`

---

## 📋 Objective

Scaffold the complete Next.js 15 project with all necessary configuration, dependencies, and folder structure.

---

## 🎯 Scope

**In Scope:**
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Install and configure Tailwind CSS v4
- [ ] Install and initialize shadcn/ui
- [ ] Install Framer Motion and Lucide React
- [ ] Create project folder structure
- [ ] Configure next.config.js for static export
- [ ] Set up base layout with metadata
- [ ] Configure fonts (Inter, JetBrains Mono)
- [ ] Set up global styles with design tokens

**Out of Scope:**
- Individual page sections (handled in 04_features.task.md)
- Component implementations (handled in 04_features.task.md)
- Content/copy writing (use placeholder text)

---

## 📚 Context

### Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui
- Animations: Framer Motion
- Icons: Lucide React
- Fonts: Inter, JetBrains Mono

### Project Structure

```
website/
├── app/
│   ├── page.tsx              # Landing page
│   ├── pricing/
│   │   └── page.tsx          # Pricing page
│   ├── download/
│   │   └── page.tsx          # Download page
│   ├── privacy/
│   │   └── page.tsx          # Privacy policy page
│   ├── layout.tsx            # Root layout with metadata
│   └── globals.css           # Global styles
├── components/
│   ├── sections/             # Page sections
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Comparison.tsx
│   │   ├── Testimonials.tsx
│   │   └── CTA.tsx
│   ├── ui/                   # shadcn components
│   ├── Navbar.tsx            # Navigation component
│   ├── Footer.tsx            # Footer component
│   └── DownloadButton.tsx    # Smart download button
├── lib/
│   ├── utils.ts              # Utility functions (cn helper)
│   └── github.ts             # GitHub API helpers
├── public/
│   ├── images/               # Screenshots, mockups
│   └── demo/                 # Demo video files
├── components.json           # shadcn config
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Tailwind config
└── package.json
```

### Design Tokens (from DESIGN.md)

**Colors:**
- Primary: `#0f172a` (slate-900)
- Accent: `#f59e0b` (amber-500)
- Background: `#fafaf9` (stone-50)
- Success: `#10b981` (emerald-500)

**Typography:**
- Headings: Inter, bold weights
- Body: Inter, regular weights
- Code: JetBrains Mono

**Spacing:**
- Use Tailwind's default spacing scale
- Section padding: py-16 to py-24
- Container max-width: max-w-7xl

---

## ✅ Definition of Done

- [ ] Next.js 15 project initialized in `/website/` directory
- [ ] Tailwind CSS v4 configured and working
- [ ] shadcn/ui initialized with base components installed
- [ ] Framer Motion and Lucide React installed
- [ ] Fonts (Inter, JetBrains Mono) configured
- [ ] Project folder structure created
- [ ] `next.config.js` configured for static export
- [ ] Base `layout.tsx` with metadata template
- [ ] `globals.css` with design tokens and base styles
- [ ] Build command runs successfully (`npm run build`)

---

## 📁 Expected Artifacts

| File | Purpose |
|------|---------|
| `website/package.json` | Dependencies and scripts |
| `website/next.config.js` | Next.js configuration |
| `website/tailwind.config.ts` | Tailwind CSS configuration |
| `website/components.json` | shadcn/ui configuration |
| `website/app/layout.tsx` | Root layout with metadata |
| `website/app/globals.css` | Global styles |
| `website/app/page.tsx` | Landing page (placeholder) |
| `website/lib/utils.ts` | Utility functions |
| `website/components/ui/` | shadcn components directory |

---

## 🚫 Constraints

- Use Next.js 15 with App Router (not Pages Router)
- Use TypeScript strictly (no `any` types)
- Follow shadcn/ui installation patterns exactly
- Configure for static export (`output: 'export'`)
- All dependencies must be latest stable versions
- Keep initial bundle size reasonable

---

**When Done:**
- Create `03_scaffold.result.md` in the completed folder
- Include which workflow and skills you used
- Confirm build runs without errors
- Signal completion with `attempt_completion` tool

---

*Generated by vibe-orchestrator mode*
