---
name: sora-market
description: >
  Build and operate the Sora Market Browser — a paper-trading prediction-market
  UI for browsing live, upcoming, and settled event markets, filtering by
  category, and placing simulated stakes. Use when creating or extending a
  Sora Market / Soro.Market style browser, implementing market cards, an
  order ticket, watchlists, a local portfolio, or verifying prediction-market
  UX in a real browser.
metadata:
  author: supabase
  version: "0.0.0"
---

# Sora Market Browser

Ship a self-contained prediction-market browser. The playable UI lives in
`assets/browser/` and needs no build step.

## Quick Start

1. Serve the browser from the skill directory:

```bash
python3 -m http.server 4173 --directory skills/sora-market/assets/browser
```

2. Open `http://127.0.0.1:4173/` and exercise the full loop:
   search → filter → open a market → enter a stake → place a paper order →
   confirm the position in **Portefeuille**.

3. Keep market data in `assets/browser/markets.json`. Keep stake math in
   `assets/browser/payout.js`. Never duplicate payout formulas in the view.

## Core Workflow

1. **Load markets** from `markets.json`. Do not invent prices in the view layer.
2. **Filter** by text, category (`all|sport|crypto|tech|politics|culture`),
   and status (`live|upcoming|settled`).
3. **Sort** by volume, time remaining, or newest.
4. **Select a market** to open the detail drawer and order ticket.
5. **Validate the ticket** before writing the portfolio:
   - stake > 0
   - stake ≤ available cash
   - an outcome is selected
   - the market is not settled
6. **Persist** cash, positions, and watchlist in `localStorage` under the
   `sora-market:` prefix.
7. **Verify in a real browser** — a screenshot is not enough. Click, type,
   submit, then open Portefeuille and Favoris.

## Data Model

Each market must include `id`, `question`, `category`, `status`, `volume`,
`closeAt`, `resolvedOutcomeId` (nullable), and `outcomes[]` with
`id`, `label`, and `price` in `(0, 1)`.

See [references/data-market-model.md](references/data-market-model.md).

## UI Contracts

- **Market board**: See [references/ui-market-board.md](references/ui-market-board.md)
- **Order ticket**: See [references/ui-order-ticket.md](references/ui-order-ticket.md)
- **Portfolio**: See [references/persist-portfolio.md](references/persist-portfolio.md)

## Guardrails

- Label the experience as **paper trading**. Never imply on-chain settlement
  unless a real contract is wired.
- Starting cash is `$1000`. Do not reset a user's stored portfolio on reload.
- Settled markets are read-only. Offer **Réclamer** only when the stored
  position matches `resolvedOutcomeId`.
- Empty, error, and zero-result states must be visible — do not render a
  blank board.
- Keep the UI keyboard-friendly: `/` focuses search, `Escape` closes the
  drawer.

## Verification Checklist

- Home board renders cards with prices, volume, and status.
- Search and category chips update the same list (no stale state).
- Opening a live market shows payout that updates as the stake changes.
- An oversized stake is rejected without mutating cash.
- A valid order decreases cash and appears under Portefeuille.
- Watchlist add/remove survives reload.
- Mobile viewport (375px) keeps the ticket usable in the drawer.
