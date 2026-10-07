// Career mentor endpoint for both halves of the mentor match. Lives in the
// chapter Google account, bound to the mentor request spreadsheet.
//   mentor.html           associate members asking for one -> "Mentor Requests" tab
//   become-a-mentor.html  alumni signing up to mentor      -> "Alumni Mentors" tab
// Each POST appends a row to the matching tab and emails the chapter inbox.
// Deploy instructions: see README.md in this folder.

const NOTIFY_EMAIL = 'zeta.rho.zeta.lca@gmail.com';
const REQUESTS_SHEET = 'Mentor Requests';
const MENTORS_SHEET = 'Alumni Mentors';

// Value of the hidden formType field on become-a-mentor.html. Anything else
// is filed as a mentor request, which is all this endpoint handled at first.
const SIGNUP_FORM_TYPE = 'Alumni Mentor Sign-Up';

// The last two columns of each tab are never written by the forms; whoever is
// doing the matching fills them in by hand.
const REQUESTS_HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone', 'Major', 'Graduation Year',
  'Career Field', 'Career Goal', 'Wants to Work In', 'Wants Help With',
  'Matched Mentor', 'Notes',
];
const MENTORS_HEADERS = [
  'Timestamp', 'Name', 'Email', 'Phone', 'Major', 'Graduation Year',
  'Career Field', 'Current Role', 'About You', 'Matched Brothers', 'Notes',
];

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

    return p.formType === SIGNUP_FORM_TYPE ? saveSignup(p) : saveRequest(p);
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

function saveRequest(p) {
  // The page marks these required, but a request that skips the page
  // shouldn't be able to add blank rows.
  if (!text(p.name) || !text(p.careerGoal)) {
    return json({ result: 'error', message: 'Name and career goal are required.' });
  }

  getSheet(REQUESTS_SHEET, REQUESTS_HEADERS).appendRow([
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

  notify('Career mentor request: ' + (p.name || 'Unknown'), [
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
  ]);

  return json({ result: 'success' });
}

function saveSignup(p) {
  if (!text(p.name) || !text(p.email) || !text(p.careerField)) {
    return json({ result: 'error', message: 'Name, email and career field are required.' });
  }

  // Same column order as the requests tab through Career Field, so a brother
  // and a mentor can be compared left to right.
  getSheet(MENTORS_SHEET, MENTORS_HEADERS).appendRow([
    new Date(),
    text(p.name),
    text(p.email),
    text(p.phone),
    text(p.major),
    text(p.graduationYear),
    text(p.careerField),
    text(p.currentRole),
    text(p.aboutYou),
  ]);

  notify('Alumni mentor sign-up: ' + (p.name || 'Unknown'), [
    'An alumnus signed up to be a career mentor.',
    '',
    'Name: ' + (p.name || ''),
    'Email: ' + (p.email || ''),
    'Phone: ' + (p.phone || ''),
    'FSU major: ' + (p.major || ''),
    'Graduation year: ' + (p.graduationYear || ''),
    'Career field: ' + (p.careerField || ''),
    'Current role: ' + (p.currentRole || ''),
    '',
    'About:',
    p.aboutYou || '',
    '',
    'All mentors and requests: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
  ]);

  return json({ result: 'success' });
}

// The sheet row is the record; the email is only a heads-up. If it fails
// (e.g. the daily mail quota), the caller still reports success so nobody
// resubmits and creates a duplicate row.
function notify(subject, lines) {
  try {
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: lines.join('\n') });
  } catch (mailErr) {
    console.error('Mentor form saved but notification email failed: ' + mailErr);
  }
}

// Sheets runs a cell that starts with "=" (or "+", "-", "@") as a formula.
// A leading apostrophe keeps whatever was typed into the form as plain text.
function text(value) {
  const s = String(value || '').trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
