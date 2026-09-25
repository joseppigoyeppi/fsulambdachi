# Form backends (Google Sheets + Apps Script)

Both site forms post to Google Apps Script web apps that log each submission
to a Google Sheet in the chapter account and email zeta.rho.zeta.lca@gmail.com.
No submission limits, no third-party service.

| Form | Page | Script | Spreadsheet |
|---|---|---|---|
| Cookout RSVP | `pages/alumni.html` | `rsvp-to-sheet.gs` | 2026 Alumni Cookout RSVPs |
| Contact update | `pages/contact.html` | `contact-to-sheet.gs` | Zeta-Rho Zeta Alumni Contact List |
| Drink orders (hidden page) | `zr-orders-…/` (built from `orders-app/`) | `orders-backend.gs` | Zeta Rho Orders |

Each page has an endpoint constant near the bottom of its inline script
(`RSVP_ENDPOINT` / `CONTACT_ENDPOINT`). While a constant is empty, that form
falls back to Formspree, so a half-finished setup never breaks the site.

## Deploying a script (about 3 minutes each)

1. Log into the chapter Google account and open the target spreadsheet
   (create it first if it doesn't exist).
2. Extensions > Apps Script. Delete any placeholder code, paste in the full
   contents of the matching `.gs` file from this folder, save (Cmd+S).
3. **Authorize:** in the toolbar's function dropdown (next to Debug), select
   `authorize`, click **Run**, and click through the permissions flow:
   choose the chapter account > "Google hasn't verified this app" > Advanced >
   Go to (project name) > Allow. Skipping this leaves the web app returning
   an access-denied page to visitors.
4. Deploy > New deployment. Click the gear next to "Select type", choose
   **Web app**. Set:
   - Execute as: **Me**
   - Who has access: **Anyone**  (must be "Anyone", NOT "Anyone with a
     Google account", or browser submissions will fail)
5. Click Deploy and copy the **Web app URL** (ends in `/exec`).
6. Paste the URL into the matching endpoint constant in the page's HTML.

## Notes per script

- `rsvp-to-sheet.gs` creates its own "RSVPs" tab with headers on first use.
- `contact-to-sheet.gs` appends to the EXISTING contact list, matching values
  to columns by the header names in row 1 (case/punctuation-insensitive).
  A header it doesn't recognize gets an empty cell; the mapping lives in
  `valueForColumn`, so add cases there if columns are renamed or added.

## Editing a script later

Changes to the code do NOT go live on save. After editing, go to
Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy.
The URL stays the same.

## Orders backend (`orders-backend.gs`)

Backs the hidden drink-order page at `/zr-orders-…/` (not linked anywhere on the site).
Unlike the two form scripts it is a small API: the page reads the menu from it, submits
orders + payment screenshots to it, and the admin dashboard on the page logs in
through it. Data lives in the "Zeta Rho Orders" spreadsheet (tabs `products`, `orders`,
`settings`) and screenshots in Drive under "Zeta Rho Orders / Screenshots".

Setup differs from the form scripts in three places:

1. Create a new spreadsheet named **Zeta Rho Orders** in the chapter account, paste in
   `orders-backend.gs`, save.
2. Run **`setup`** (not `authorize`) once from the function dropdown and grant the
   permissions. It creates the tabs, the Drive folders, and the starter menu.
3. **Project Settings (gear icon) > Script properties > Add script property**, twice:
   `ADMIN_USERNAME` and `ADMIN_PASSWORD`. That is the only login for the page's admin
   area; whoever knows it can change prices and see every order. Do not put the
   password in the code or in the repo.
4. Deploy as a Web app exactly like the others (Execute as **Me**, access **Anyone**)
   and copy the `/exec` URL.
5. Paste the URL into `zr-orders-…/config.js` (the `endpoint` value) and commit. That is
   the equivalent of `RSVP_ENDPOINT`. The page works the moment it is pushed.

Each order also emails `NOTIFY_EMAIL` (top of the script) with the items, total, and a
link to the screenshot. Set it to `''` to turn that off. After editing the script, deploy
a **New version** as described above; the URL stays the same.

**Who can get in.** The page shows nothing until a brother enters a first name + last
name that is on the `members` tab and the current access code (`accessCode` in the
`settings` tab, default `ZETARHO`). Both are edited on the page itself: Admin > Members
(paste names, one per line) and Admin > Settings (the code). Changing the code signs
everyone out until they enter the new one. `setup()` also stores a `MEMBER_SECRET`
script property that signs the sign-in tokens — leave it alone.

**Order runs.** Admin > Settings holds the current run's name (e.g. "Fall Smth") and its
access code. Every order is stamped with the run name it was placed under (`run`
column on the `orders` tab), the `runs` tab keeps the history of names + codes, and the
Orders page can filter by run.

**Leaderboard.** The page shows brothers an all-time top 10 by paid packs. It is computed
from the `orders` tab, so it lasts as long as the rows do — never delete old orders if
you want the board to keep counting.

**Activity log.** Every sign-in and sign-out (with the device), refused sign-ins (with the
name typed and why), orders placed or refused, every admin change, and errors go to the
`log` tab — newest at the bottom, trimmed to the latest 5000 rows. Admin > Activity reads
it with filters (Sign-ins, Orders, Admin changes, Problems). Rows marked `error` are real
bugs: `server.error` from this script, `client.error` from someone's browser.

**Ranks.** Brothers see their own order history and a rank (Bronze/Silver/Gold/Platinum/
Alcoholic) from packs in orders you have marked **paid** or delivered — so nothing counts
until the money is in. Admin > Members shows the leaderboard.

**Updating the script later** (e.g. after pulling a new `orders-backend.gs`): paste the
new code over the old, save, run `setup` once more (it adds any new tabs/settings and is
safe to repeat), then Deploy > Manage deployments > pencil > Version: New version >
Deploy. The URL does not change, so `config.js` stays as it is.
