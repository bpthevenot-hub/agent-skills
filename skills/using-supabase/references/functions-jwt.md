---
title: Verify JWTs and Keep Secrets in Edge Functions
impact: MEDIUM
impactDescription: Prevents unauthenticated invocation and leaking the service-role key to clients
tags: edge-functions, deno, jwt, webhooks, secrets
---

## Verify JWTs and Keep Secrets in Edge Functions

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
