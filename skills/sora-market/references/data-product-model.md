---
title: Keep One Shared Product Schema
impact: CRITICAL
impactDescription: Catalog, detail, and cart stay in sync when they read the same objects
tags: data, schema, products
---

## Keep One Shared Product Schema

Every surface reads the same `products.json` objects. Do not reshape a product
in the view or invent a second price field.

**Incorrect:**

```js
function renderCard(product) {
  return `${product.name} ${product.usd}`;
}
```

**Correct:**

```js
{
  "id": "p-earbuds-01",
  "title": "Écouteurs TWS ANC Pro",
  "category": "electronique",
  "price": 18.9,
  "compareAt": 39.9,
  "rating": 4.7,
  "orders": 12840,
  "freeShipping": true,
  "store": "Sora Audio Store",
  "shipsFrom": "Chine",
  "deliveryMin": 8,
  "deliveryMax": 15,
  "stock": 186,
  "flash": true,
  "emoji": "🎧",
  "accent": "#ff6a3d",
  "variants": [
    { "id": "black", "label": "Noir" },
    { "id": "white", "label": "Blanc" }
  ],
  "bullets": ["Réduction de bruit", "Boîtier USB-C", "30 h d'autonomie"]
}
```

`price` and `compareAt` are EUR numbers. `flash` marks a Super deal. `category`
is one of `electronique|mode|maison|beaute|sport|auto|jouets|jardin`.
