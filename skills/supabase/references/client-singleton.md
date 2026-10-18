# Browser singleton and request-scoped SSR clients

Keep the browser client shared. Create a new server client for each request;
never share a user's server cookies globally or expose a server secret.

```ts
// Browser module
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;
export function browserSupabase() {
  return client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

Use a new client in each writable Route Handler. With `@supabase/ssr` >= 0.10,
`setAll` receives cookies **and cache headers**. Preserve both on every final
response, including errors and redirects; later calls with empty headers must
not erase earlier cache directives.

```ts
// app/api/me/route.ts
import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const pendingCookies: Parameters<SetAllCookies>[0] = [];
  const pendingHeaders = new Headers({ 'Cache-Control': 'private, no-store' });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          for (const { name, value } of values) request.cookies.set(name, value);
          pendingCookies.push(...values);
          for (const [name, value] of Object.entries(headers)) {
            pendingHeaders.set(name, value);
          }
        },
      },
    },
  );
  const finish = (response: NextResponse) => {
    for (const { name, value, options } of pendingCookies) {
      response.cookies.set(name, value, options);
    }
    pendingHeaders.forEach((value, name) => response.headers.set(name, value));
    return response;
  };
  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) {
      return finish(NextResponse.json({ error: 'Unauthenticated' }, { status: 401 }));
    }
    return finish(NextResponse.json({ userId: data.claims.sub }));
  } catch {
    return finish(NextResponse.json({ error: 'Session check failed' }, { status: 500 }));
  }
}
```

Server Components cannot write cookies. Use the official Proxy refresh pattern
(`proxy.ts` for Next.js >= 16, `middleware.ts` for <= 15), copying refreshed
cookies and headers to the final response. Do not reuse this Route Handler
unchanged in a Server Component. When using `cookies()` from `next/headers`,
await that store. Never use ISR/shared caching for authenticated responses.
Verify refresh after expiry, two concurrent users' isolation, and a second
`setAll(..., {})` retaining the first call's cache headers.

Sources: [SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs),
[advanced SSR guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide).
