# Zeta Rho Orders (source)

The hidden drink-order page on the chapter site. This folder is the **source**; the
built page lives in `../zr-orders-…/` and is what GitHub Pages actually serves at
`https://www.fsulambdachi.com/zr-orders-…/`. It is not linked from anywhere on the
site and carries a `noindex` tag — only people with the link find it.

Brothers sign in at the door with their first + last name (must be on the members list)
and the shared access code; the browser remembers them. They pick drinks/merch, pay the
chapter, and upload the payment screenshot — the order is logged under the name they
signed in with. Tapping their name opens their account: rank badge, packs ordered, progress
to the next rank, and their full order history. Ranks come from packs in orders marked paid
(Bronze < 10 · Silver 10 · Gold 30 · Platinum 60 · Alcoholic 100), and an all-time top-10
leaderboard on the store. Orders are stamped with the current **run** (a name + access code
the admin sets, e.g. "Fall Smth" / `PUMPKIN`), so history reads by run. A single admin account
sees every order with its screenshot, totals per product, a rank leaderboard, manages the
members list and access code, changes prices, adds products, and exports a CSV.

## How it fits the site

Same pattern as the RSVP and contact forms: static files in this repo, a Google Apps
Script as the backend, data in a Google Sheet in the chapter account.

```
orders-app/            ← Next.js source (this folder)
   public/config.js    ← backend URL, like RSVP_ENDPOINT
zr-orders-…/           ← built output, committed, served by GitHub Pages
apps-script/orders-backend.gs   ← the backend (deploy once, see apps-script/README.md)
.nojekyll              ← lets GitHub Pages serve the _next/ folder
```

Storage: `products`, `orders`, `settings` tabs in the "Zeta Rho Orders" spreadsheet;
payment screenshots in Drive ("Zeta Rho Orders / Screenshots", private to the chapter
account — the page only shows them to a logged-in admin).

## Working on it

```bash
cd orders-app
npm install
npm run dev        # http://localhost:3000/zr-orders-…/  (+ a local mock backend on :8787)
```

`npm run dev` starts a mock of the Apps Script (`scripts/mock-backend.mjs`, in-memory,
login `tarokh` / `test-password`) so nothing touches the real sheet while developing.

When done:

```bash
npm run typecheck && npm run lint
npm run build      # exports static files into ../zr-orders-…/ (keeps the configured endpoint)
npm run e2e        # full click-through of the built page against the mock backend
BACKEND=gas npm run e2e   # same, but running the real orders-backend.gs code locally
```

Then commit `orders-app/` **and** the rebuilt `zr-orders-…/` folder together.

## Changing things

- **Prices, sold out, new products, payment text, open/closed, who can get in, the
  access code** — on the page, in `/zr-orders-…/admin/`. No code, no rebuild.
- **The backend URL** — `zr-orders-…/config.js` (`endpoint`). Rebuilds keep it.
- **The secret path** — `BASE_PATH` in `next.config.ts`, then `npm run build`, delete the
  old folder, commit both.
- **Admin username/password** — Script properties of the Apps Script project.
- **Design / animations** — `components/site/*`; the 3D hero is `hero-3d.tsx`, the drawn
  ΛΧΑ mark is `greek-mark.tsx`, colors and fonts are in `app/globals.css`.

## Layout of the code

| Path | What |
| --- | --- |
| `app/page.tsx` | Storefront: loads the menu from the backend, then renders `components/site/storefront.tsx` |
| `app/admin/*` | Admin pages (dashboard, orders + search, products, members, settings); `layout.tsx` is the login gate |
| `components/site/gate.tsx` | The members-only door (name + access code) shown before anything else |
| `components/site/account-drawer.tsx`, `rank-badge.tsx`, `lib/ranks.ts` | My account panel, the five badges, rank thresholds and per-member stats |
| `components/site/leaderboard.tsx` | All-time top 10 (podium + list), fed by the `leaderboard` action |
| `components/site/*` | Hero (sunrise, 3D cans + gold letters), can marquee, product cards, cart drawer, checkout |
| `components/admin/*` | Session/login, product editor, settings form |
| `lib/api.ts` | The only place that talks to the backend — every action, request and reply shape |
| `lib/catalog.ts`, `lib/stats.ts`, `lib/csv.ts`, `lib/money.ts` | Pure helpers (grouping, dashboard totals, CSV, dollars) |
| `scripts/mock-backend.mjs` | Local stand-in for the Apps Script, same contract |
| `scripts/gas-harness.mjs` | Runs the real `.gs` file in Node with fake Sheets/Drive for testing |
| `scripts/publish.mjs` | Copies the export into the hidden folder, writes `.nojekyll`, fixes Windows export names |
