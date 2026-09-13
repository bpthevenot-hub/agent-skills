---
title: Persist Paper Portfolio Under One Prefix
impact: HIGH
impactDescription: Reload keeps cash, positions, and favorites without wiping the demo
tags: persist, localStorage, portfolio
---

## Persist Paper Portfolio Under One Prefix

Store only JSON under `sora-market:`. Seed cash once; never overwrite a stored
portfolio with the default $1000 on every page load.

**Incorrect:**

```js
localStorage.setItem("cash", "1000");
localStorage.setItem("positions", "[]");
```

**Correct:**

```js
const KEYS = {
  cash: "sora-market:cash",
  positions: "sora-market:positions",
  watchlist: "sora-market:watchlist",
};

function loadCash() {
  const raw = localStorage.getItem(KEYS.cash);
  if (raw === null) return 1000;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 1000;
}
```

Claim a settled position only when `position.outcomeId === market.resolvedOutcomeId`.
Winning credit is `potentialPayout(position.stake, position.price)`. Losing
positions credit `0` and are still marked claimed so they cannot be replayed.
