# Handoff: the hidden order page

Everything for the order page is already inside this copy of the `fsulambdachi` repo.
Nothing existing was changed; these were **added**:

| Added | What it is |
| --- | --- |
| `zr-orders-s4gsie1j/` | The built page. GitHub Pages serves it at `https://www.fsulambdachi.com/zr-orders-s4gsie1j/`. No link to it anywhere; `noindex` for search engines. |
| `orders-app/` | Its source code (only needed to change the design/code; prices etc. are edited on the page itself). |
| `apps-script/orders-backend.gs` | The backend — one Apps Script, same idea as the RSVP/contact scripts. |
| `.nojekyll` (repo root) | Tells GitHub Pages not to run Jekyll, which otherwise silently drops the page's `_next/` folder. Has no effect on the rest of the site. |
| A section at the bottom of `apps-script/README.md` | Deploy steps for the backend. |

## Going live — about 10 minutes, no code

1. **Push this repo** as-is. The page is now reachable at the hidden URL but shows
   "Ordering is offline" until step 4.
2. **Deploy the backend** — follow *Orders backend* in `apps-script/README.md`:
   new spreadsheet "Zeta Rho Orders" in the chapter Google account → Extensions →
   Apps Script → paste `orders-backend.gs` → run `setup` once → add the two script
   properties (`ADMIN_USERNAME`, `ADMIN_PASSWORD` — Tarokh will send them; they are
   deliberately not in the repo) → Deploy → Web app (Execute as Me, access Anyone) →
   copy the `/exec` URL.
3. **Paste the URL** into `zr-orders-s4gsie1j/config.js` between the quotes of
   `endpoint: ""`. This is exactly what `RSVP_ENDPOINT` is in `rsvp.html`.
4. **Commit and push.** Done. Share the URL with brothers privately (group chat); the
   admin area is the same URL + `admin/`.

## Letting brothers in

The page is empty until someone signs in with a name on the list and the access code.
After deploying: open `…/admin/` → **Members** → paste the roster (one "First Last" per
line) → Save; then **Settings** → change the access code from the default `ZETARHO` and
share it in the group chat.

## Where things live afterwards

- Orders, prices, settings → the "Zeta Rho Orders" spreadsheet (and the page's admin area).
- Payment screenshots → Drive folder "Zeta Rho Orders / Screenshots" (private; the page
  shows them only to a logged-in admin).
- Each new order emails the chapter inbox (`NOTIFY_EMAIL` at the top of the script).

## If the code ever needs changing

`orders-app/README.md` covers development. Short version: `cd orders-app && npm install
&& npm run dev`, edit, then `npm run build` and commit both `orders-app/` and the
rebuilt `zr-orders-s4gsie1j/`. Rebuilding keeps the endpoint you pasted.

## Things not to change

- The `.nojekyll` file — removing it breaks the page's scripts and styles.
- `orders-backend.gs` validation (first + last name + screenshot required) and the
  admin-only `screenshot` action — payment screenshots must stay private.
- Do not add a link to the hidden page anywhere on the public site.
