# Form backends (Google Sheets + Apps Script)

Both site forms post to Google Apps Script web apps that log each submission
to a Google Sheet in the chapter account and email zeta.rho.zeta.lca@gmail.com.
No submission limits, no third-party service.

| Form | Page | Script | Spreadsheet |
|---|---|---|---|
| Cookout RSVP | `pages/alumni.html` | `rsvp-to-sheet.gs` | 2026 Alumni Cookout RSVPs |
| Contact update | `pages/contact.html` | `contact-to-sheet.gs` | Zeta-Rho Zeta Alumni Contact List |

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
