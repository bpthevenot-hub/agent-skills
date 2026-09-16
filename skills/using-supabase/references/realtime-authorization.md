---
title: Authorize Realtime Channels Per User
impact: MEDIUM
impactDescription: Prevents private live updates from being broadcast to unauthorized subscribers
tags: realtime, channels, authorization, broadcast, presence
---

## Authorize Realtime Channels Per User

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
