---
title: Use a Singleton Client with the Framework's SSR Pattern
impact: MEDIUM-HIGH
impactDescription: Avoids connection storms, auth state bugs, and server/client key mix-ups
tags: client, supabase-js, ssr, nextjs, singleton
---

## Use a Singleton Client with the Framework's SSR Pattern

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
