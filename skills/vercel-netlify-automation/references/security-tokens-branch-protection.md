---
title: Protect main and Manage Deploy Tokens
impact: CRITICAL
impactDescription: Prevents unreviewed prod deploys and token leaks
tags: branch-protection, secrets, tokens, rollback, notifications
---

## Protect main and Manage Deploy Tokens

Auto-deploy pipelines multiply the blast radius of mistakes and leaked credentials. Harden the pipeline before turning it on.

**Incorrect (token hardcoded, no branch protection):**

```yaml
# .github/workflows/deploy.yml — DO NOT DO THIS
- run: npx vercel deploy --prod --token=abcd1234HARDCODEDTOKEN
```

```bash
# main branch: anyone can push directly
git push origin main   # goes straight to production, no review
```

**Correct (scoped secrets + protected branch):**

```yaml
# .github/workflows/deploy.yml
- run: npx vercel deploy --prod --token=$VERCEL_TOKEN --yes
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

Branch protection settings (GitHub → Settings → Branches → `main`):

```text
[x] Require a pull request before merging
[x] Require status checks to pass before merging
    - lint
    - test
    - build
[x] Require branches to be up to date before merging
[x] Do not allow bypassing the above settings
```

Operational checklist:
- Vercel/Netlify tokens scoped to a single project/site.
- Rotate tokens every 90 days and after any suspected leak.
- Enable Slack/email/webhook notifications for failed deploys.
- Bookmark the "Instant Rollback" action in each dashboard.
