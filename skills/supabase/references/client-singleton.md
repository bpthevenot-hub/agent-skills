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

Implement both cookie methods for a writable Next.js Route Handler or Server
Action. Await the request's cookie store; propagate write failures there.

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function serverSupabase() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          for (const { name, value, options } of values) jar.set(name, value, options);
        },
      },
    },
  );
}
```

Server Components cannot write cookies. Follow the official framework Proxy
refresh pattern for them, including copying refreshed cookies to the response;
do not assume this writable helper can be used unchanged. Verify refresh in the
browser after expiry and isolation between two concurrent user sessions.

Source: [Supabase SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).
