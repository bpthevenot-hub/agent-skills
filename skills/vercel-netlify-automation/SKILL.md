---
name: vercel-netlify-automation
description: Automate file deployment to Vercel and Netlify with a Desktop-like workflow. Use this skill when setting up continuous deployment, connecting a Git repo to Vercel/Netlify, configuring GitHub Actions for deployment, or building a local watcher that auto-pushes file changes.
license: MIT
metadata:
  author: bpthevenot-hub
  version: "1.0.0"
---

# Vercel & Netlify Deployment Automation

Guide for automating file deployments to Vercel and Netlify, reproducing a "Desktop-like" experience where local file changes trigger automatic production deploys.

## When to Apply

Reference these guidelines when:
- Centralizing files into a Git repository for deployment
- Connecting a repo to Vercel and/or Netlify
- Writing a GitHub Actions workflow that builds and deploys
- Building a local file watcher that auto-commits and pushes
- Securing deployment tokens and protecting the main branch
- Documenting a deployment automation for a team

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Git Repository Setup | HIGH | `git-` |
| 2 | Platform Connection | HIGH | `platform-` |
| 3 | CI/CD Workflow | MEDIUM-HIGH | `ci-` |
| 4 | Desktop-like Watchers | MEDIUM | `desktop-` |
| 5 | Security & Monitoring | CRITICAL | `security-` |
| 6 | Documentation | LOW-MEDIUM | `docs-` |

## How to Use

Read individual rule files for detailed explanations and examples:

```
references/git-repo-structure.md
references/platform-vercel-connect.md
references/ci-github-actions.md
references/_sections.md
```

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## References

- https://vercel.com/docs/deployments/git
- https://docs.netlify.com/configure-builds/get-started/
- https://docs.github.com/en/actions
