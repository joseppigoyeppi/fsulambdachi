// Contact-info endpoint for the alumni contact form on pages/contact.html.
// Lives in the chapter Google account, bound to the "Zeta-Rho Zeta Alumni
// Contact List" spreadsheet. Each POST appends a row, matching values to the
// sheet's existing columns by their header names (row 1), then emails the
// chapter inbox. Deploy instructions: see README.md in this folder.

const NOTIFY_EMAIL = 'zeta.rho.zeta.lca@gmail.com';
// Tab to append to. Leave '' to use the first tab in the spreadsheet.
const SHEET_NAME = '';

// Run this once from the editor (select "authorize" in the function dropdown,
// click Run) to grant the script its Sheets and email permissions BEFORE
// deploying. Without this, visitors get an access-denied page.
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  MailApp.getRemainingDailyQuota();
}

function doPost(e) {
  try {
    const p = e.parameter;

    // Honeypot: hidden field on the form that only bots fill in.
    if (p._gotcha) {
      return json({ result: 'success' });
    }

    const sheet = getSheet();
    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    sheet.appendRow(headers.map(function(h) { return valueForColumn(h, p); }));

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Alumni contact update: ' + [p.firstName, p.lastName].filter(Boolean).join(' '),
      body: [
        'New alumni contact submission (already added to the sheet).',
        '',
        'Name: ' + [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '),
        'Zeta number: ' + (p.zetaNumber || ''),
        'Email: ' + (p.email || ''),
        'Phone: ' + (p.phone || ''),
        'Initiation year: ' + (p.initiationYear || ''),
        'Graduation year: ' + (p.graduationYear || ''),
        'City/State: ' + [p.city, p.state].filter(Boolean).join(', '),
        '',
        'Sheet: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join('\n'),
    });

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

// Maps one of the sheet's column headers to the matching form field, so the
// row lands in your existing column order. Headers are compared with spaces,
// case, and punctuation ignored ("Zeta #" matches "zeta"). A header with no
// match gets an empty cell. If you rename or add columns, add cases here.
function valueForColumn(header, p) {
  const key = String(header).toLowerCase().replace(/[^a-z]/g, '');
  switch (key) {
    case 'timestamp': case 'date': case 'dateadded': case 'submitted':
      return new Date();
    case 'firstname': case 'first':
      return p.firstName || '';
    case 'middlename': case 'middle':
      return p.middleName || '';
    case 'lastname': case 'last':
      return p.lastName || '';
    case 'name': case 'fullname':
      return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
    case 'zetanumber': case 'zeta': case 'zp': case 'zetano':
      return p.zetaNumber || '';
    case 'email': case 'emailaddress':
      return p.email || '';
    case 'phone': case 'phonenumber': case 'cellphone': case 'cell':
      return p.phone || '';
    case 'initiationyear': case 'initiateyear': case 'yearinitiated': case 'initiation':
      return p.initiationYear || '';
    case 'graduationyear': case 'gradyear': case 'graduation': case 'classof':
      return p.graduationYear || '';
    case 'city': case 'primarycity':
      return p.city || '';
    case 'state': case 'primarystate':
      return p.state || '';
    case 'location': case 'citystate':
      return [p.city, p.state].filter(Boolean).join(', ');
    default:
      return '';
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) {
    throw new Error('Sheet tab not found: ' + SHEET_NAME);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
