---
title: Filter the Same Market List Everywhere
impact: HIGH
impactDescription: Shared filters keep search, chips, and tabs from showing stale cards
tags: ui, filters, board
---

## Filter the Same Market List Everywhere

Derive the visible board from one function. Search, category, status, and sort
must all read that result.

**Incorrect:**

```js
if (tab === "live") render(liveMarkets);
if (query) render(allMarkets.filter((m) => m.question.includes(query)));
```

**Correct:**

```js
function visibleMarkets(markets, { query, category, status, sort }) {
  const needle = query.trim().toLowerCase();
  const filtered = markets.filter((market) => {
    const matchesQuery =
      !needle ||
      market.question.toLowerCase().includes(needle) ||
      market.outcomes.some((o) => o.label.toLowerCase().includes(needle));
    const matchesCategory = category === "all" || market.category === category;
    const matchesStatus = status === "all" || market.status === status;
    return matchesQuery && matchesCategory && matchesStatus;
  });
  return sortMarkets(filtered, sort);
}
```

Render a dedicated empty state when the filtered list is empty. Show volume,
implied percent, and time remaining on every card.
