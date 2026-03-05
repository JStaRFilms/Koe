# Task: Flatten Koe Website Directory Structure

**Status:** Ready for Assignment  
**Priority:** High  
**Mode:** Code  
**Skills Required:** `nextjs-standards`, `filesystem-operations`

---

## 🎯 Objective

Flatten the directory structure from:
```
koe-website/
├── docs/           # Keep as-is
└── website/        # MOVE contents to koe-website/ root
    ├── app/
    ├── components/
    ├── lib/
    ├── public/
    ├── package.json
    └── ...
```

To:
```
koe-website/
├── app/            # Next.js app (was website/app/)
├── components/     # Next.js components (was website/components/)
├── lib/            # Next.js lib (was website/lib/)
├── public/         # Next.js public (was website/public/)
├── package.json    # Next.js package.json (was website/package.json)
├── docs/           # Keep as-is
└── ...             # All other Next.js config files
```

---

## ✅ Requirements

### 1. Move All Next.js Files
Move everything from `koe-website/website/` to `koe-website/` root:

**Directories to move:**
- `koe-website/website/app/` → `koe-website/app/`
- `koe-website/website/components/` → `koe-website/components/`
- `koe-website/website/lib/` → `koe-website/lib/`
- `koe-website/website/public/` → `koe-website/public/`

**Files to move:**
- `koe-website/website/package.json` → `koe-website/package.json`
- `koe-website/website/tsconfig.json` → `koe-website/tsconfig.json`
- `koe-website/website/next.config.ts` → `koe-website/next.config.ts`
- `koe-website/website/components.json` → `koe-website/components.json`
- `koe-website/website/postcss.config.mjs` → `koe-website/postcss.config.mjs`
- `koe-website/website/eslint.config.mjs` → `koe-website/eslint.config.mjs`
- `koe-website/website/.gitignore` → `koe-website/.gitignore`
- `koe-website/website/README.md` → `koe-website/README.md`

### 2. Handle package-lock.json
- Move `koe-website/website/package-lock.json` → `koe-website/package-lock.json`
- OR delete it and regenerate with `npm install` after moving

### 3. Update Paths (if any hardcoded)
Check for any hardcoded paths in the code that reference `website/` and update them:
- Search for `"/website/"` or `"website/"` in all moved files
- Most Next.js paths should be relative and work fine

### 4. Verify Build Works
After moving:
```bash
cd koe-website
npm install  # if needed
npm run build  # or next build
```

### 5. Clean Up
- Delete the empty `koe-website/website/` directory after successful move

---

## ⚠️ Important Notes

1. **Keep `docs/` intact** — Don't move or modify anything in `koe-website/docs/`
2. **Preserve file permissions** — Make sure executable scripts remain executable
3. **Git tracking** — If using git, the move should preserve history (use `git mv` if possible)
4. **Node_modules** — If `website/node_modules/` exists, either:
   - Move it too (faster but not recommended)
   - Delete it and re-run `npm install` (cleaner)

---

## 🧪 Verification Checklist

After completion, verify:
- [x] All files moved from `website/` to root
- [x] `koe-website/website/` directory is empty or deleted
- [x] `koe-website/docs/` still exists and unchanged
- [x] `npm install` works without errors (used `pnpm install` instead, as requested)
- [x] `npm run build` completes successfully (used `pnpm run build`)
- [x] No broken imports or path references
- [x] All pages (/, /download, /pricing, /privacy) build correctly

---

## 📋 Expected Final Structure

```
koe-website/
├── app/                    # Next.js App Router
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── download/
│   ├── pricing/
│   └── privacy/
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── sections/           # Page sections
│   └── ...
├── lib/                    # Utilities
│   ├── utils.ts
│   └── github.ts
├── public/                 # Static assets
│   ├── og-image.svg
│   ├── sitemap.xml
│   └── ...
├── docs/                   # Documentation (KEEP AS-IS)
│   ├── PRD.md
│   ├── DESIGN.md
│   ├── tasks/
│   └── ...
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── next.config.ts          # Next.js config
├── components.json         # shadcn config
├── postcss.config.mjs      # PostCSS config
├── eslint.config.mjs       # ESLint config
├── .gitignore              # Git ignore
└── README.md               # Project readme
```

---

## 🚀 Steps to Execute

1. Read current structure to understand what exists
2. Move all directories (app, components, lib, public) to root
3. Move all config files (package.json, tsconfig.json, etc.) to root
4. Delete empty `website/` directory
5. Run `npm install` to verify dependencies
6. Run `npm run build` to verify build works
7. Report success with any issues encountered

---

**Result:** Flattened structure with Next.js at root level and docs/ preserved alongside.
