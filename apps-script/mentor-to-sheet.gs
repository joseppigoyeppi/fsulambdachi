// Career mentor request endpoint for the associate member form on mentor.html.
// Lives in the chapter Google account, bound to the mentor request spreadsheet.
// Each POST appends a row to the "Mentor Requests" tab and emails the chapter
// inbox. Deploy instructions: see README.md in this folder.

const NOTIFY_EMAIL = 'zeta.rho.zeta.lca@gmail.com';
const SHEET_NAME = 'Mentor Requests';

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

    // The page marks these required, but a request that skips the page
    // shouldn't be able to add blank rows.
    if (!text(p.name) || !text(p.careerGoal)) {
      return json({ result: 'error', message: 'Name and career goal are required.' });
    }

    // The last two header columns (Matched Mentor, Notes) are left blank for
    // whoever is doing the matching to fill in by hand.
    getSheet().appendRow([
      new Date(),
      text(p.name),
      text(p.email),
      text(p.phone),
      text(p.major),
      text(p.graduationYear),
      text(p.careerField),
      text(p.careerGoal),
      text(p.targetLocation),
      text(p.helpWanted),
    ]);

    // The row above is the record; the email is only a heads-up. If it fails
    // (e.g. the daily mail quota), still report success so the member doesn't
    // resubmit and create a duplicate row.
    try {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'Career mentor request: ' + (p.name || 'Unknown'),
        body: [
          'New career mentor request from an associate member.',
          '',
          'Name: ' + (p.name || ''),
          'Email: ' + (p.email || ''),
          'Phone: ' + (p.phone || ''),
          'Major: ' + (p.major || ''),
          'Graduation year: ' + (p.graduationYear || ''),
          'Career field: ' + (p.careerField || ''),
          'Wants to work in: ' + (p.targetLocation || ''),
          'Wants help with: ' + (p.helpWanted || ''),
          '',
          'Career goal:',
          p.careerGoal || '',
          '',
          'All requests: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
        ].join('\n'),
      });
    } catch (mailErr) {
      console.error('Mentor request saved but notification email failed: ' + mailErr);
    }

    return json({ result: 'success' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

// Sheets runs a cell that starts with "=" (or "+", "-", "@") as a formula.
// A leading apostrophe keeps whatever was typed into the form as plain text.
function text(value) {
  const s = String(value || '').trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp', 'Name', 'Email', 'Phone', 'Major', 'Graduation Year',
      'Career Field', 'Career Goal', 'Wants to Work In', 'Wants Help With',
      'Matched Mentor', 'Notes',
    ]);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
