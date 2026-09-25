---
title: Connect Vercel to the Git Repository
impact: HIGH
impactDescription: Automatic production and preview deploys on every push
tags: vercel, git-integration, preview-deployments
---

## Connect Vercel to the Git Repository

Import the repo from the Vercel dashboard so each push to `main` deploys to production and each PR gets a preview URL.

**Incorrect (manual `vercel deploy` from a laptop):**

- Fragile: depends on one machine.
- No preview URLs on PRs.
- Environment variables kept locally.

**Correct (Git-connected project):**

1. Vercel Dashboard → **Add New → Project** → import from GitHub.
2. Configure:
   - **Framework preset**: Next.js, Vite, Astro, Other (static), etc.
   - **Build command**: e.g. `npm run build`
   - **Output directory**: e.g. `dist` or `.next`
   - **Root directory** (monorepo): `apps/site-a`
3. Add environment variables for **Production / Preview / Development** scopes.
4. Enable **Preview Deployments** for all branches.

Optional `vercel.json` at repo root to pin config in code:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null
}
```
