# Using Supabase

**Version 1.0.0**
Supabase
September 2026

> This document is optimized for AI agents and LLMs. Rules are prioritized by performance impact.

---

## Abstract

Private guide for building applications with Supabase. Use this skill when setting up a Supabase project, implementing authentication, querying the database, configuring Row Level Security, uploading files to Storage, writing Edge Functions, subscribing to Realtime channels, using the supabase-js client, or working with the Supabase CLI. Treat all project credentials referenced through this skill as private.

---

## Table of Contents

1. [Getting Started](#getting-started) - **HIGH**
   - 1.1 [Keep Project URL and API Keys in Environment Variables](#11-keep-project-url-and-api-keys-in-environment-variables)

2. [Auth](#auth) - **CRITICAL**
   - 2.1 [Enable RLS and Scope Policies to auth.uid()](#21-enable-rls-and-scope-policies-to-authuid)

3. [Database](#database) - **HIGH**
   - 3.1 [Manage Schema Changes with CLI Migrations](#31-manage-schema-changes-with-cli-migrations)

4. [Storage](#storage) - **MEDIUM-HIGH**
   - 4.1 [Use Private Buckets with Signed URLs](#41-use-private-buckets-with-signed-urls)

5. [Edge Functions](#edge-functions) - **MEDIUM**
   - 5.1 [Verify JWTs and Keep Secrets in Edge Functions](#51-verify-jwts-and-keep-secrets-in-edge-functions)

6. [Realtime](#realtime) - **MEDIUM**
   - 6.1 [Authorize Realtime Channels Per User](#61-authorize-realtime-channels-per-user)

7. [Client Libraries](#client-libraries) - **MEDIUM-HIGH**
   - 7.1 [Use a Singleton Client with the Framework's SSR Pattern](#71-use-a-singleton-client-with-the-frameworks-ssr-pattern)

8. [CLI & Tools](#cli-tools) - **LOW-MEDIUM**
   - 8.1 [Develop Against a Local Stack with supabase start](#81-develop-against-a-local-stack-with-supabase-start)

---

## 1. Getting Started

**Impact: HIGH**

Project setup, connection strings, initial configuration, and first steps with Supabase.

### 1.1 Keep Project URL and API Keys in Environment Variables

**Impact: CRITICAL (Prevents leaking private project credentials into source control and client bundles)**

Every Supabase project has a URL, an `anon` public key, and a `service_role` secret key. The `service_role` key bypasses Row Level Security entirely, so it must stay private on the server. Commit only an `.env.example` template, never real values.

**Incorrect:**

```ts
import { createClient } from "@supabase/supabase-js";

// Hardcoded credentials committed to the repo — anyone can read them,
// and the service_role key gives full database access.
const supabase = createClient(
  "https://abcdefgh.supabase.co",
  "SERVICE_ROLE_KEY_HARDCODED_IN_SOURCE"
);
```

**Correct:**

```ts
import { createClient } from "@supabase/supabase-js";

// Server-only file: never import this from client components.
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

// Client bundle: safe, uses the anon key (RLS still applies).
const browserClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

Commit `.env.example` with placeholder values and add `.env` to `.gitignore`. Rotate keys immediately if a real value is ever committed.

---

## 2. Auth

**Impact: CRITICAL**

Authentication, authorization, Row Level Security, social login, and session management.

### 2.1 Enable RLS and Scope Policies to auth.uid()

**Impact: CRITICAL (Prevents any user from reading or modifying other users' private data)**

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

---

## 3. Database

**Impact: HIGH**

Postgres database, migrations, queries, RLS policies, and data modeling.

### 3.1 Manage Schema Changes with CLI Migrations

**Impact: HIGH (Keeps schema reproducible across local, staging, and production environments)**

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

---

## 4. Storage

**Impact: MEDIUM-HIGH**

File uploads, buckets, access control, and media handling.

### 4.1 Use Private Buckets with Signed URLs

**Impact: MEDIUM-HIGH (Prevents unauthorized public access to user-uploaded files)**

Storage buckets default to private, but making a bucket public is one click — and then every file is reachable by anyone with the URL. Keep buckets private and hand out short-lived signed URLs for downloads, backed by RLS policies on `storage.objects`.

**Incorrect:**

```ts
// Public bucket: anyone on the internet can enumerate and download
// every file, forever, with no auth check.
const { data } = supabase.storage
  .from("user-documents") // bucket set to public
  .getPublicUrl("passport-scan.pdf");
```

**Correct:**

```ts
// Private bucket + signed URL valid for 60 seconds, issued only
// after a server-side authorization check.
const { data, error } = await supabase.storage
  .from("user-documents")
  .createSignedUrl(`private/${user.id}/passport-scan.pdf`, 60);

if (error) throw error;
return data.signedUrl;
```

Add an RLS policy on `storage.objects` restricting access to the owning user's folder, e.g. `(storage.foldername(name))[1] = auth.uid()::text`.

---

## 5. Edge Functions

**Impact: MEDIUM**

Serverless functions, Deno runtime, webhooks, and background tasks.

### 5.1 Verify JWTs and Keep Secrets in Edge Functions

**Impact: MEDIUM (Prevents unauthenticated invocation and leaking the service-role key to clients)**

Edge Functions run with the `service_role` key available by default. Enforce JWT verification so only authenticated users can invoke them, and read credentials from the function environment instead of baking them into code that might be shared or logged.

**Incorrect:**

```ts
// supabase/functions/send-report/index.ts
// --no-verify-jwt: anyone with the URL can invoke this function.
Deno.serve(async () => {
  const resendKey = "re_123456789_hardcoded"; // leaked if code is shared
  return new Response("sent");
});
```

**Correct:**

```ts
// config.toml: verify_jwt = true (the default)
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // stays server-side
  );

  const { data, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (error || !data.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(`Hello ${data.user.id}`);
});
```

Set secrets with `supabase secrets set KEY=value` — never commit them to the repo.

---

## 6. Realtime

**Impact: MEDIUM**

Real-time subscriptions, presence, broadcast, and live updates.

### 6.1 Authorize Realtime Channels Per User

**Impact: MEDIUM (Prevents private live updates from being broadcast to unauthorized subscribers)**

Realtime subscriptions are long-lived WebSocket connections. Subscribe to user-scoped channels with unique names and enforce authorization in the database so a leaked channel name does not expose everyone's private events.

**Incorrect:**

```ts
// A single global channel: every connected client receives every
// user's private notifications.
const channel = supabase
  .channel("notifications")
  .on("broadcast", { event: "new" }, (payload) => notify(payload))
  .subscribe();
```

**Correct:**

```ts
// User-scoped channel; server publishes only after checking the
// recipient, and the client subscribes to its own channel only.
const channel = supabase
  .channel(`notifications:${userId}`)
  .on("broadcast", { event: "new" }, (payload) => notify(payload))
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") await channel.send({ type: "presence" });
  });
```

For postgres_changes subscriptions, rely on RLS: enable realtime on the table and let the row policies filter which changes each subscriber receives.

---

## 7. Client Libraries

**Impact: MEDIUM-HIGH**

supabase-js SDK, client configuration, and framework integrations.

### 7.1 Use a Singleton Client with the Framework's SSR Pattern

**Impact: MEDIUM-HIGH (Avoids connection storms, auth state bugs, and server/client key mix-ups)**

Creating a new Supabase client on every render or request leaks connections and corrupts auth state. Use the framework-specific helpers from `@supabase/ssr`, keep one browser client, and create a fresh server client per request that never ships the service-role key.

**Incorrect:**

```tsx
// New client per render: multiplies WebSocket connections and
// resets auth state; also imports the server key into the browser.
import { createClient } from "@supabase/supabase-js";

export default function Page() {
  const supabase = createClient(url, process.env.SERVICE_ROLE_KEY!);
  // ...
}
```

**Correct:**

```ts
// utils/supabase/client.ts — browser, one shared instance
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// utils/supabase/server.ts — server, per-request with cookies
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: { getAll: () => cookieStore.getAll() },
  });
};
```

---

## 8. CLI & Tools

**Impact: LOW-MEDIUM**

Supabase CLI, local development, migrations, CI/CD, and MCP integration.

### 8.1 Develop Against a Local Stack with supabase start

**Impact: LOW-MEDIUM (Keeps experiments and seed data off the production project and enables CI parity)**

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

---

## References

- https://supabase.com/docs
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database
- https://supabase.com/docs/guides/functions
