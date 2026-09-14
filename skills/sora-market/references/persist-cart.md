---
title: Persist Cart Wishlist and Orders Under One Prefix
impact: HIGH
impactDescription: Reload keeps the basket and demo orders without wiping the shopper
tags: persist, localStorage, checkout
---

## Persist Cart Wishlist and Orders Under One Prefix

Store only JSON under `sora-market:`. Do not reset a stored cart on every page
load.

**Incorrect:**

```js
localStorage.setItem("cart", "[]");
```

**Correct:**

```js
const KEYS = {
  cart: "sora-market:cart",
  wishlist: "sora-market:wishlist",
  orders: "sora-market:orders",
};

function loadCart() {
  try {
    const raw = localStorage.getItem(KEYS.cart);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
```

Shipping is `0` when subtotal `>= 15`, otherwise `2.99`. Checkout requires a
non-empty cart plus name and city. A placed order copies the lines, clears the
cart, and prepends the order to `sora-market:orders`.
