# Vercel Netlify Automation

**Version 1.0.0**
Private
September 2026

> This document is optimized for AI agents and LLMs. Rules are prioritized by performance impact.

---

## Abstract

Automate file deployment to Vercel and Netlify with a Desktop-like workflow. Use this skill when setting up continuous deployment, connecting a Git repo to Vercel/Netlify, configuring GitHub Actions for deployment, or building a local watcher that auto-pushes file changes.

---

## Table of Contents

1. [Git Repository Setup](#git-repository-setup) - **HIGH**
   - 1.1 [Centralize Files in a Well-Structured Git Repository](#11-centralize-files-in-a-well-structured-git-repository)

2. [Platform Connection](#platform-connection) - **HIGH**
   - 2.1 [Connect Netlify to the Git Repository with netlify.toml](#21-connect-netlify-to-the-git-repository-with-netlifytoml)
   - 2.2 [Connect Vercel to the Git Repository](#22-connect-vercel-to-the-git-repository)

3. [CI/CD Workflow](#cicd-workflow) - **MEDIUM-HIGH**
   - 3.1 [Deploy via GitHub Actions for Advanced Control](#31-deploy-via-github-actions-for-advanced-control)

4. [Desktop-like Watchers](#desktop-like-watchers) - **MEDIUM**
   - 4.1 [Auto-Commit and Push on Local File Change](#41-auto-commit-and-push-on-local-file-change)

5. [Security & Monitoring](#security-monitoring) - **CRITICAL**
   - 5.1 [Protect main and Manage Deploy Tokens](#51-protect-main-and-manage-deploy-tokens)

6. [Documentation](#documentation) - **LOW-MEDIUM**
   - 6.1 [Document the Automation in README.md](#61-document-the-automation-in-readmemd)

---

## 1. Git Repository Setup

**Impact: HIGH**

Structuring a Git repo as the single source of truth for deployments: layout, ignore rules, and mono- vs multi-repo choices.

### 1.1 Centralize Files in a Well-Structured Git Repository

**Impact: HIGH (Enables all downstream automation and prevents drift)**

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

```sql
my-site/
  .gitignore
  package.json
  src/
  public/
node_modules/
dist/
.next/
.netlify/
.vercel/
.env
.env.local
```

`.gitignore` at minimum:
Choose layout:
- **Repo per site**: simplest, best isolation of Vercel/Netlify projects.
- **Monorepo** (`apps/site-a`, `apps/site-b`): use only if projects share code; configure root directory in each platform's project settings.

---

## 2. Platform Connection

**Impact: HIGH**

Connecting Vercel and Netlify to the Git repository, configuring build settings, environment variables, and preview deployments.

### 2.1 Connect Netlify to the Git Repository with netlify.toml

**Impact: HIGH (Version-controlled build config and automatic Deploy Previews)**

Netlify config should live in the repo (`netlify.toml`) so builds are reproducible and reviewable.

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

---

### 2.2 Connect Vercel to the Git Repository

**Impact: HIGH (Automatic production and preview deploys on every push)**

Import the repo from the Vercel dashboard so each push to `main` deploys to production and each PR gets a preview URL.

**Correct (Git-connected project):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null
}
```

---

## 3. CI/CD Workflow

**Impact: MEDIUM-HIGH**

GitHub Actions workflows that lint, test, build, and deploy to Vercel and Netlify with fine-grained control.

### 3.1 Deploy via GitHub Actions for Advanced Control

**Impact: MEDIUM-HIGH (Gates deploys behind tests and enables parallel multi-platform deploys)**

When you need lint/test gates or parallel deploys to both platforms, use GitHub Actions instead of relying solely on native Git integrations.

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

---

## 4. Desktop-like Watchers

**Impact: MEDIUM**

Local scripts and tools that watch a folder and auto-commit/push or directly deploy on file change.

### 4.1 Auto-Commit and Push on Local File Change

**Impact: MEDIUM (Reproduces a drag-and-drop deploy experience)**

To reproduce a "Desktop-like" experience where dropping a file into a folder triggers a deploy, run a local watcher that commits and pushes on change.

**Correct (Node watcher with `chokidar`):**

```bash
// watch.js
const chokidar = require("chokidar");
const { execSync } = require("child_process");

let timer;
chokidar.watch(".", { ignored: /(^|[/\\])\.|node_modules|dist/ })
  .on("all", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        execSync("git add -A", { stdio: "inherit" });
        execSync(`git commit -m "auto: $(date -Iseconds)"`, { stdio: "inherit" });
        execSync("git push", { stdio: "inherit" });
      } catch (e) {
        // ignore "nothing to commit"
      }
    }, 2000); // debounce 2s
  });
vercel deploy --prod --token=$VERCEL_TOKEN
netlify deploy --prod --dir=./public --auth=$NETLIFY_AUTH_TOKEN
```

Run with `node watch.js`. Push triggers Vercel/Netlify auto-deploys.
Cross-platform alternatives:
- macOS/Linux: `fswatch -o . | xargs -n1 -I{} ./push.sh`
- Linux: `inotifywait -m -r -e modify,create,delete .`
- Any OS: **GitHub Desktop** for a GUI commit/push flow.
For static-only sites, skip Git entirely and call the CLI directly:

---

## 5. Security & Monitoring

**Impact: CRITICAL**

Branch protection, token management, deployment notifications, and rollback procedures.

### 5.1 Protect main and Manage Deploy Tokens

**Impact: CRITICAL (Prevents unreviewed prod deploys and token leaks)**

Auto-deploy pipelines multiply the blast radius of mistakes and leaked credentials. Harden the pipeline before turning it on.

**Incorrect (token hardcoded, no branch protection):**

```bash
# .github/workflows/deploy.yml — DO NOT DO THIS
- run: npx vercel deploy --prod --token=abcd1234HARDCODEDTOKEN
# main branch: anyone can push directly
git push origin main   # goes straight to production, no review
```

**Correct (scoped secrets + protected branch):**

```text
# .github/workflows/deploy.yml
- run: npx vercel deploy --prod --token=$VERCEL_TOKEN --yes
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
[x] Require a pull request before merging
[x] Require status checks to pass before merging
    - lint
    - test
    - build
[x] Require branches to be up to date before merging
[x] Do not allow bypassing the above settings
```

Branch protection settings (GitHub → Settings → Branches → `main`):
Operational checklist:
- Vercel/Netlify tokens scoped to a single project/site.
- Rotate tokens every 90 days and after any suspected leak.
- Enable Slack/email/webhook notifications for failed deploys.
- Bookmark the "Instant Rollback" action in each dashboard.

---

## 6. Documentation

**Impact: LOW-MEDIUM**

README and runbook conventions describing the automation for contributors.

### 6.1 Document the Automation in README.md

**Impact: LOW-MEDIUM (Onboards contributors and prevents tribal knowledge)**

A short README turns the automation from tribal knowledge into a reusable process.

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

---

## References

- https://vercel.com/docs/deployments/git
- https://docs.netlify.com/configure-builds/get-started/
- https://docs.github.com/en/actions
