# Authorize private Broadcast subscriptions

A topic containing a user ID is a name, not an access check. For private
notifications, configure private channels and a matching policy. Review existing
policies too: permissive policies are combined, so a broad policy can defeat a
narrow one. Assess other channels before changing the project's public-access
setting.

```sql
create policy "Receive own notification broadcasts"
on realtime.messages for select to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) = 'notifications:' || (select auth.uid())::text
);
```

RLS is already enabled on this managed table; do not attempt to alter its
ownership or add another `ENABLE ROW LEVEL SECURITY` statement.

```ts
const channel = supabase.channel(`notifications:${userId}`, {
  config: { private: true },
});
channel.on('broadcast', { event: 'new' }, ({ payload }) => notify(payload));
channel.subscribe();
// On cleanup:
// await supabase.removeChannel(channel);
```

Use the signed-in client's current JWT. Keep notification publishing in a
trusted backend that checks the recipient; keep its secret key server-side.
This receive-only example intentionally grants no client Broadcast INSERT.
If clients must publish, design a separate INSERT policy rather than assuming
the topic name protects writes. `postgres_changes` follows the source table's
RLS; it is a different authorization path.

Test user A's topic with A, B and a signed-out client, plus JWT refresh and
subscription cleanup. Verify receive and send permissions separately.

Source: [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).
