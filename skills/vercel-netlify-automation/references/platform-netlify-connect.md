---
title: Connect Netlify to the Git Repository with netlify.toml
impact: HIGH
impactDescription: Version-controlled build config and automatic Deploy Previews
tags: netlify, netlify-toml, deploy-previews
---

## Connect Netlify to the Git Repository with netlify.toml

Netlify config should live in the repo (`netlify.toml`) so builds are reproducible and reviewable.

**Incorrect (config only in Netlify UI):**

- Changes made in the dashboard aren't versioned.
- Rollback of build settings is impossible.

**Correct (`netlify.toml` at repo root):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

Then in Netlify Dashboard → **Add new site → Import from Git** → select repo. Deploy Previews on PRs are enabled by default.
