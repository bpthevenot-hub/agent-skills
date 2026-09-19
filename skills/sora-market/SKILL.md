---
name: sora-market
description: >
  Build and operate Sora Market, an AliExpress-style shopping marketplace with
  catalog, cart, wishlist, and checkout. Use when creating or extending a Sora
  Market storefront, an AliExpress-like marketplace browser, product cards,
  shipping badges, a shopping cart, or a demo checkout.
metadata:
  author: supabase
  version: "0.0.0"
---

# Sora Market

Sora Market is a **shopping marketplace** in the AliExpress mold: browse
goods, compare prices, add to cart, and place a demo order. The playable
storefront lives in `assets/browser/` and needs no build step.

## Quick Start

```bash
python3 -m http.server 4173 --directory skills/sora-market/assets/browser
```

Open `http://127.0.0.1:4173/` and run the shopper loop: search → open a
product → pick a variant → add to cart → checkout.

Deploy the same static storefront:

```bash
npx vercel --cwd skills/sora-market/assets/browser --prod --yes
```

## Core Workflow

1. **Load products** from `products.json`. Do not invent prices in the view.
2. **Filter** by text, category, free shipping, and minimum rating.
3. **Sort** by orders, price, or discount.
4. **Open a product** for gallery, variants, quantity, and shipping promise.
5. **Validate the cart write** with `cart.js` before touching `localStorage`.
6. **Persist** cart, wishlist, and orders under the `sora-market:` prefix.
7. **Verify in a real browser** — click, type, add to cart, then open Panier
   and Commandes.

## Data Model

See [references/data-product-model.md](references/data-product-model.md).

## UI Contracts

- **Catalog**: [references/ui-catalog.md](references/ui-catalog.md)
- **Product detail**: [references/ui-product-detail.md](references/ui-product-detail.md)
- **Cart & checkout**: [references/persist-cart.md](references/persist-cart.md)

## Guardrails

- This is a **demo storefront**. Never imply a real payment capture.
- Prices are EUR. Free shipping starts at a **15 €** subtotal; otherwise add
  **2,99 €**.
- Quantity must stay between 1 and the product `stock`.
- Empty catalog, empty cart, and empty wishlist need visible empty states.
- Keep `/` focused on search and `Escape` closing overlays.

## Verification Checklist

- Home shows flash deals and a product grid with price, rating, and orders.
- Search and category chips update the same list.
- Product overlay lets the shopper change variant and quantity.
- Add to cart increases the header badge and appears in Panier.
- Checkout with an empty cart is blocked; a filled cart creates an order.
- Wishlist add/remove survives reload.
- Mobile viewport (375px) keeps search, cards, and cart usable.
