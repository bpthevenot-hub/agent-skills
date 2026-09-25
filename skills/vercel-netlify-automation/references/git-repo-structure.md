---
title: Centralize Files in a Well-Structured Git Repository
impact: HIGH
impactDescription: Enables all downstream automation and prevents drift
tags: git, repository, gitignore, monorepo
---

## Centralize Files in a Well-Structured Git Repository

Git must be the single source of truth for deployments. Without a clean repo layout and ignore rules, Vercel/Netlify builds break intermittently and secrets leak.

**Incorrect (loose folder, no ignore rules):**

```text
my-site/
  index.html
  node_modules/     # committed by mistake, huge
  .env              # secrets pushed to origin
  dist/             # build artifacts tracked
```

**Correct (clean structure, one repo per site or monorepo):**

```text
my-site/
  .gitignore
  package.json
  src/
  public/
```

`.gitignore` at minimum:

```
node_modules/
dist/
.next/
.netlify/
.vercel/
.env
.env.local
```

Choose layout:
- **Repo per site**: simplest, best isolation of Vercel/Netlify projects.
- **Monorepo** (`apps/site-a`, `apps/site-b`): use only if projects share code; configure root directory in each platform's project settings.
