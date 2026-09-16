---
title: Keep Project URL and API Keys in Environment Variables
impact: CRITICAL
impactDescription: Prevents leaking private project credentials into source control and client bundles
tags: setup, env, keys, security, private
---

## Keep Project URL and API Keys in Environment Variables

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
