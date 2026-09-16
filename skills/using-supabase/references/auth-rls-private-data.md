---
title: Enable RLS and Scope Policies to auth.uid()
impact: CRITICAL
impactDescription: Prevents any user from reading or modifying other users' private data
tags: auth, rls, policies, private-data, security
---

## Enable RLS and Scope Policies to auth.uid()

Tables exposed through the anon key are world-readable until Row Level Security is enabled. Enable RLS on every table that holds user data and write policies keyed to `auth.uid()` so each user can only reach their own rows.

**Incorrect:**

```sql
create table profiles (
  id uuid primary key references auth.users,
  display_name text
);
-- RLS never enabled: the anon key can SELECT/INSERT/UPDATE/DELETE
-- every row in the table.
```

**Correct:**

```sql
create table profiles (
  id uuid primary key references auth.users,
  display_name text
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

Test policies by impersonating users with `set request.jwt.claims` or through the Supabase dashboard's policy simulator before shipping.
