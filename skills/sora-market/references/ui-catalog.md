---
title: Filter the Same Catalog Everywhere
impact: HIGH
impactDescription: Search, chips, and shipping filters never show a stale grid
tags: ui, catalog, filters
---

## Filter the Same Catalog Everywhere

Derive the visible grid from one function. Search, category, free shipping,
rating, and sort all read that result.

**Incorrect:**

```js
if (tab === "flash") render(flashProducts);
if (query) render(allProducts.filter((p) => p.title.includes(query)));
```

**Correct:**

```js
function visibleProducts(products, { query, category, freeShipping, minRating, sort }) {
  const needle = query.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchesQuery =
      !needle ||
      product.title.toLowerCase().includes(needle) ||
      product.store.toLowerCase().includes(needle);
    const matchesCategory = category === "all" || product.category === category;
    const matchesShip = !freeShipping || product.freeShipping;
    const matchesRating = product.rating >= minRating;
    return matchesQuery && matchesCategory && matchesShip && matchesRating;
  });
  return sortProducts(filtered, sort);
}
```

Show discount percent, sold count, and a shipping badge on every card. Render a
dedicated empty state when the filtered list is empty.
