# Section Definitions

This file defines the rule categories for Vercel & Netlify deployment automation. Rules are assigned to sections based on their filename prefix.

---

## 1. Git Repository Setup (git)
**Impact:** HIGH
**Description:** Structuring a Git repo as the single source of truth for deployments: layout, ignore rules, and mono- vs multi-repo choices.

## 2. Platform Connection (platform)
**Impact:** HIGH
**Description:** Connecting Vercel and Netlify to the Git repository, configuring build settings, environment variables, and preview deployments.

## 3. CI/CD Workflow (ci)
**Impact:** MEDIUM-HIGH
**Description:** GitHub Actions workflows that lint, test, build, and deploy to Vercel and Netlify with fine-grained control.

## 4. Desktop-like Watchers (desktop)
**Impact:** MEDIUM
**Description:** Local scripts and tools that watch a folder and auto-commit/push or directly deploy on file change.

## 5. Security & Monitoring (security)
**Impact:** CRITICAL
**Description:** Branch protection, token management, deployment notifications, and rollback procedures.

## 6. Documentation (docs)
**Impact:** LOW-MEDIUM
**Description:** README and runbook conventions describing the automation for contributors.
