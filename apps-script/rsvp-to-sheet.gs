// RSVP endpoint for the 2026 Alumni Cookout form on pages/alumni.html.
// Lives in the chapter Google account, bound to the RSVP spreadsheet.
// Each POST appends a row to the "RSVPs" tab and emails the chapter inbox.
// Deploy instructions: see README.md in this folder.

const NOTIFY_EMAIL = 'zeta.rho.zeta.lca@gmail.com';
const SHEET_NAME = 'RSVPs';

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
    // Pretend success so they don't retry.
    if (p._gotcha) {
      return json({ result: 'success' });
    }

    getSheet().appendRow([
      new Date(),
      p.name || '',
      p.initiationYear || '',
      p.email || '',
      p.guests || '',
    ]);

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: '2026 Alumni Cookout RSVP: ' + (p.name || 'Unknown'),
      body: [
        'New RSVP for the 2026 Alumni Cookout.',
        '',
        'Name: ' + (p.name || ''),
        'Initiation year: ' + (p.initiationYear || ''),
        'Email: ' + (p.email || ''),
        'Guests: ' + (p.guests || ''),
        '',
        'All RSVPs: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join('\n'),
    });

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Name', 'Initiation Year', 'Email', 'Guests']);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
