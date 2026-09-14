---
title: Deploy via GitHub Actions for Advanced Control
impact: MEDIUM-HIGH
impactDescription: Gates deploys behind tests and enables parallel multi-platform deploys
tags: github-actions, ci-cd, vercel-cli, netlify-cli
---

## Deploy via GitHub Actions for Advanced Control

When you need lint/test gates or parallel deploys to both platforms, use GitHub Actions instead of relying solely on native Git integrations.

**Incorrect (native integration only, no tests):**

Any broken push reaches production because Vercel/Netlify build immediately.

**Correct (`.github/workflows/deploy.yml`):**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

      - name: Deploy to Vercel
        run: npx vercel deploy --prod --token=$VERCEL_TOKEN --yes
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy to Netlify
        run: npx netlify-cli deploy --prod --dir=dist
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

Store `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` in **Repository Settings → Secrets and variables → Actions**.

If you keep the native Git integrations enabled, disable auto-deploy on `main` in one of them to avoid double deploys.
