---
name: using-supabase
description: Private guide for building applications with Supabase. Use this skill when setting up a Supabase project, implementing authentication, querying the database, configuring Row Level Security, uploading files to Storage, writing Edge Functions, subscribing to Realtime channels, using the supabase-js client, or working with the Supabase CLI. Treat all project credentials referenced through this skill as private.
license: MIT
metadata:
  author: bpthevenot-hub
  version: "1.0.0"
  visibility: private
---

# Using Supabase

Private, end-to-end guide for building on Supabase: project setup, Auth, Database, Storage, Edge Functions, Realtime, client libraries, and CLI workflows.

## Privacy

This skill is **private**. It covers workflows that touch project URLs, API keys, and service-role credentials:

- Never hardcode Supabase URLs or keys in source files — always use environment variables.
- Never expose the `service_role` key to the browser, a client bundle, or a public repository.
- Never commit `.env` files; commit only `.env.example` templates.

## When to Apply

Reference these guidelines when:
- Setting up a Supabase project and wiring connection strings
- Implementing authentication, social login, or session management
- Writing queries, migrations, or Row Level Security policies
- Uploading files to Storage buckets with access control
- Building Edge Functions, webhooks, or background tasks
- Subscribing to Realtime channels for live updates
- Configuring the supabase-js client in a framework
- Using the Supabase CLI for local development, CI/CD, or MCP

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Getting Started | HIGH | `start-` |
| 2 | Auth | CRITICAL | `auth-` |
| 3 | Database | HIGH | `database-` |
| 4 | Storage | MEDIUM-HIGH | `storage-` |
| 5 | Edge Functions | MEDIUM | `functions-` |
| 6 | Realtime | MEDIUM | `realtime-` |
| 7 | Client Libraries | MEDIUM-HIGH | `client-` |
| 8 | CLI & Tools | LOW-MEDIUM | `cli-` |

## How to Use

Read individual rule files for detailed explanations and examples:

```
references/start-env-keys.md
references/auth-rls-private-data.md
references/database-migrations.md
references/_sections.md
```

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## References

- https://supabase.com/docs
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database
- https://supabase.com/docs/guides/functions
