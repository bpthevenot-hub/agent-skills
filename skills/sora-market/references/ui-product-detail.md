---
title: Validate Quantity Before Adding to Cart
impact: CRITICAL
impactDescription: Stops oversell and empty-variant writes from corrupting the cart
tags: detail, cart, validation
---

## Validate Quantity Before Adding to Cart

Use `cart.js` for money and quantity checks. Reject the add before any
`localStorage` write.

**Incorrect:**

```js
cart.push({ id: product.id, qty: input.value });
```

**Correct:**

```js
import { validateAdd, lineTotal } from "./cart.js";

const error = validateAdd({ product, qty, variantId, cart });
if (error) throw new Error(error);

cart = upsertLine(cart, { productId, variantId, qty, price: product.price });
```

Quantity must be an integer `>= 1` and `<= product.stock`. A variant is
required when `product.variants.length > 0`. Merging the same
`productId + variantId` increments quantity instead of duplicating the line.
