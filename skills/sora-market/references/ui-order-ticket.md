---
title: Validate the Ticket Before Writing Cash
impact: CRITICAL
impactDescription: Stops invalid paper trades from corrupting the simulated portfolio
tags: ticket, payout, validation
---

## Validate the Ticket Before Writing Cash

Use `payout.js` for every number shown on the ticket. Reject the order before
any `localStorage` write.

**Incorrect:**

```js
cash -= Number(stakeInput.value);
positions.push({ marketId, stake: stakeInput.value });
```

**Correct:**

```js
import { potentialPayout, potentialProfit } from "./payout.js";

const payout = potentialPayout(stake, outcome.price);
const profit = potentialProfit(stake, outcome.price);

if (market.status === "settled") throw new Error("Marché déjà réglé");
if (!outcome) throw new Error("Choisis une issue");
if (!(stake > 0)) throw new Error("Mise invalide");
if (stake > cash) throw new Error("Solde insuffisant");
```

Payout for a winning share is `stake / price`. Profit is `payout - stake`.
Recompute both on every stake or outcome change. Disable **Miser** on settled
markets.
