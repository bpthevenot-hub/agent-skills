---
title: Develop Against a Local Stack with supabase start
impact: LOW-MEDIUM
impactDescription: Keeps experiments and seed data off the production project and enables CI parity
tags: cli, local-dev, seed, ci, mcp
---

## Develop Against a Local Stack with supabase start

The Supabase CLI runs the full stack locally in Docker, giving every developer an identical, disposable environment. Develop and test against local instances, seed them from `supabase/seed.sql`, and link to the remote project only for deploys.

**Incorrect:**

```bash
# Pointing the dev app straight at production: one bad migration or
# seed script corrupts real user data.
supabase link --project-ref abcdefgh
npm run dev # env points at the production URL
```

**Correct:**

```bash
# Fully local stack with its own anonymous keys and seed data
supabase init
supabase start          # prints local URL + anon/service keys
supabase db reset       # applies migrations + seed.sql

# Link only when ready to deploy
supabase link --project-ref abcdefgh
supabase db push
```

Keep the local keys printed by `supabase start` in `.env.local` (git-ignored), and reuse the same `supabase start` + `supabase db reset` flow in CI so tests run against the same schema as production.
