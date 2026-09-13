---
title: Keep One Shared Market Schema
impact: CRITICAL
impactDescription: One schema prevents the board, ticket, and portfolio from drifting
tags: data, schema, markets
---

## Keep One Shared Market Schema

Every surface reads the same `markets.json` objects. Do not reshape markets in
the view or invent fields at render time.

**Incorrect:**

```js
// Card invents a binary Yes/No even when the market has three outcomes
function renderCard(market) {
  return `${market.question} YES ${market.yesPrice}`;
}
```

**Correct:**

```js
{
  "id": "m-btc-150k",
  "question": "Bitcoin au-dessus de 150 000 $ au 31 octobre 2026 ?",
  "category": "crypto",
  "status": "live",
  "volume": 428000,
  "createdAt": "2026-09-01T12:00:00.000Z",
  "closeAt": "2026-10-31T23:59:59.000Z",
  "resolvedOutcomeId": null,
  "outcomes": [
    { "id": "yes", "label": "Oui", "price": 0.41 },
    { "id": "no", "label": "Non", "price": 0.59 }
  ]
}
```

`price` is a probability in `(0, 1)`. Display cents as `Math.round(price * 100)`.
`status` is `live`, `upcoming`, or `settled`. `resolvedOutcomeId` is set only
when `status === "settled"`.
