---
title: Manage Schema Changes with CLI Migrations
impact: HIGH
impactDescription: Keeps schema reproducible across local, staging, and production environments
tags: database, migrations, cli, schema
---

## Manage Schema Changes with CLI Migrations

Editing the database through the dashboard leaves no history and cannot be reproduced. Capture every schema change as a versioned migration with the Supabase CLI so environments stay in sync and changes are reviewable in Git.

**Incorrect:**

```sql
-- Run once by hand in the production dashboard SQL editor.
-- No record of who changed what, no rollback, staging is now different.
alter table posts add column summary text;
```

**Correct:**

```bash
# Start the local stack, then diff changes into a migration file
supabase start
supabase db diff -f add_post_summary

# Review the generated file, then apply locally and push to remote
supabase db reset
supabase db push
```

Commit the generated `supabase/migrations/*.sql` files alongside the code that depends on them so a single PR carries both the schema and the application change.
