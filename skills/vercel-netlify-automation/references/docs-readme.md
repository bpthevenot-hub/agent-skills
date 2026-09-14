---
title: Document the Automation in README.md
impact: LOW-MEDIUM
impactDescription: Onboards contributors and prevents tribal knowledge
tags: readme, documentation, runbook
---

## Document the Automation in README.md

A short README turns the automation from tribal knowledge into a reusable process.

**Incorrect:**

Empty README; only the original author knows how deploys work.

**Correct (`README.md` skeleton):**

```markdown
# my-site

## Structure
- `src/` – source files
- `public/` – static assets
- `netlify.toml` / `vercel.json` – platform config

## Local development
    npm install
    npm run dev

## Build
    npm run build   # outputs to dist/

## Deployment
Pushes to `main` are auto-deployed to:
- Vercel: https://<project>.vercel.app
- Netlify: https://<site>.netlify.app

PRs generate preview URLs on both platforms.

## Required environment variables
| Name        | Scope       | Purpose            |
|-------------|-------------|--------------------|
| API_URL     | all         | Backend endpoint   |
| ANALYTICS_ID| prod only   | Analytics tracking |

## Local "drop to deploy"
    node watch.js

## Rollback
Use the "Instant Rollback" button in Vercel or Netlify dashboards.

## Contact
Maintainer: @your-handle
```
