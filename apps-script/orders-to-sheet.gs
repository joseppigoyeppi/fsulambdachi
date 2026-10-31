// Order endpoint for the brothers-only order page at pages/orders.html.
// Lives in the chapter Google account, bound to the "Zeta Rho Orders" spreadsheet.
// The page sends JSON: {action: "menu"} to load products, {action: "order"} to place
// an order. Every request carries the chapter password, which is checked here, so
// nothing can be read or written without it. Deploy instructions: see README.md.
//
// Tabs (all created and seeded on first use):
//   Settings  - password, open/closed, payment instructions, notify email
//   Products  - the menu; edit prices, availability, and add rows here
//   Orders    - one row per order; set Status to Paid / Delivered / Cancelled
//   Items     - one row per line item (feeds Totals)
//   Totals    - per-product counts and revenue, all formulas
// Screenshots are saved to a Drive folder in this account and linked from Orders.

const DEFAULT_NOTIFY_EMAIL = 'zeta.rho.zeta.lca@gmail.com';
const DEFAULT_PASSWORD = 'zetarho2026';
const SCREENSHOT_FOLDER_NAME = 'Zeta Rho Order Screenshots';
const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;
const STATUSES = ['Pending', 'Paid', 'Delivered', 'Cancelled'];

// Run this once from the editor (select "authorize" in the function dropdown,
// click Run) to grant the script its Sheets, Drive, and email permissions
// BEFORE deploying. Without this, visitors get an access-denied page.
// It also creates and seeds every tab, so you can look the sheet over first.
function authorize() {
  SpreadsheetApp.getActiveSpreadsheet().getName();
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder().getName();
  ensureSheets();
}

function doGet() {
  return ContentService.createTextOutput('Zeta Rho orders endpoint is running.');
}

function doPost(e) {
  try {
    const body = parseBody(e);
    // Honeypot: hidden field only bots fill in. Pretend success so they don't retry.
    if (body.website) return json({ result: 'success' });

    const settings = readSettings();
    if (String(body.password || '') !== String(settings['Order password'] || DEFAULT_PASSWORD)) {
      return json({ result: 'error', code: 'password', message: 'Wrong password.' });
    }

    if (body.action === 'menu') return json(menuResponse(settings));
    if (body.action === 'order') return json(placeOrder(body, settings));
    return json({ result: 'error', message: 'Unknown action.' });
  } catch (err) {
    return json({ result: 'error', message: String(err) });
  }
}

function parseBody(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // fall through to form fields
    }
  }
  return (e && e.parameter) || {};
}

// ---------------------------------------------------------------------------
// Menu

function menuResponse(settings) {
  return {
    result: 'success',
    open: isOpen(settings),
    closedMessage: String(settings['Closed message'] || 'Ordering is closed right now.'),
    paymentInstructions: String(settings['Payment instructions'] || ''),
    products: readProducts().filter(function (p) { return p.available; }),
  };
}

function isOpen(settings) {
  const v = settings['Ordering open'];
  return v === true || String(v).toUpperCase() === 'TRUE' || String(v).toLowerCase() === 'yes';
}

function readProducts() {
  const sheet = ensureSheets().products;
  const rows = sheet.getDataRange().getValues();
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    products.push({
      id: String(r[0]).trim(),
      category: String(r[1] || 'drinks').trim().toLowerCase() === 'merch' ? 'merch' : 'drinks',
      brand: String(r[2] || '').trim(),
      name: String(r[3] || '').trim(),
      pack: String(r[4] || '').trim(),
      price: Number(r[5]) || 0,
      available: r[6] === true || String(r[6]).toUpperCase() === 'TRUE',
      image: String(r[7] || '').trim(),
      sort: Number(r[8]) || 0,
    });
  }
  products.sort(function (a, b) { return a.sort - b.sort; });
  return products;
}

// ---------------------------------------------------------------------------
// Orders

function placeOrder(body, settings) {
  if (!isOpen(settings)) {
    return { result: 'error', code: 'closed', message: String(settings['Closed message'] || 'Ordering is closed right now.') };
  }
  const clean = function (v) { return String(v || '').trim().replace(/\s+/g, ' ').slice(0, 40); };
  const firstName = clean(body.firstName);
  const lastName = clean(body.lastName);
  const note = String(body.note || '').trim().slice(0, 500);
  if (!firstName || !lastName) return { result: 'error', code: 'name', message: 'Enter your first and last name.' };

  const products = readProducts();
  const byId = {};
  products.forEach(function (p) { byId[p.id] = p; });
  const lines = [];
  const items = Array.isArray(body.items) ? body.items : [];
  items.forEach(function (item) {
    const qty = Math.floor(Number(item && item.qty));
    const product = byId[item && item.id];
    if (!product || !(qty >= 1 && qty <= 99)) return;
    if (!product.available) throw new Error(product.name + ' just sold out. Remove it and try again.');
    lines.push({ id: product.id, brand: product.brand, name: product.name, qty: qty, price: product.price, total: round2(product.price * qty) });
  });
  if (lines.length === 0) return { result: 'error', code: 'items', message: 'Pick at least one item.' };
  const total = round2(lines.reduce(function (sum, l) { return sum + l.total; }, 0));

  const shot = body.screenshot || {};
  if (!shot.data || !/^image\//.test(String(shot.type || ''))) {
    return { result: 'error', code: 'screenshot', message: 'Add a screenshot of your payment.' };
  }
  const bytes = Utilities.base64Decode(String(shot.data).replace(/^data:[^,]*,/, ''));
  if (bytes.length === 0) return { result: 'error', code: 'screenshot', message: 'Add a screenshot of your payment.' };
  if (bytes.length > MAX_SCREENSHOT_BYTES) return { result: 'error', code: 'screenshot', message: 'That screenshot is too large. Try a smaller one.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheets = ensureSheets();
    const number = nextOrderNumber(sheets.orders);
    const fullName = firstName + ' ' + lastName;
    const ext = extensionFor(String(shot.type));
    const blob = Utilities.newBlob(bytes, String(shot.type), '#' + number + ' ' + fullName + '.' + ext);
    const file = screenshotFolder(settings).createFile(blob);
    const now = new Date();
    const itemsText = lines.map(function (l) { return l.qty + 'x ' + l.name; }).join(', ');

    sheets.orders.appendRow([now, number, firstName, lastName, itemsText, total, note, file.getUrl(), 'Pending', '']);

    lines.forEach(function (l) {
      sheets.items.appendRow([now, number, l.id, l.brand + ' ' + l.name, l.qty, l.price, l.total]);
      const r = sheets.items.getLastRow();
      sheets.items.getRange(r, 8, 1, 5).setFormulas([[
        '=IFERROR(VLOOKUP(B' + r + ', Orders!$B:$I, 8, FALSE), "")',
        '=IF(H' + r + '="Cancelled", 0, E' + r + ')',
        '=IF(OR(H' + r + '="Paid", H' + r + '="Delivered"), E' + r + ', 0)',
        '=IF(H' + r + '="Delivered", E' + r + ', 0)',
        '=IF(H' + r + '="Cancelled", 0, G' + r + ')',
      ]]);
    });

    notify(settings, number, fullName, lines, total, note, file, blob);
    return { result: 'success', orderNumber: number, total: total, lines: lines };
  } finally {
    lock.releaseLock();
  }
}

function nextOrderNumber(orders) {
  const last = orders.getLastRow();
  if (last < 2) return 1001;
  const numbers = orders.getRange(2, 2, last - 1, 1).getValues();
  let max = 1000;
  numbers.forEach(function (row) { const n = Number(row[0]); if (n > max) max = n; });
  return max + 1;
}

function notify(settings, number, fullName, lines, total, note, file, blob) {
  const to = String(settings['Notify email'] || DEFAULT_NOTIFY_EMAIL);
  if (!to) return;
  try {
    MailApp.sendEmail({
      to: to,
      subject: 'Order #' + number + ': ' + fullName + ' ($' + total.toFixed(2) + ')',
      body: [
        'New order from the chapter site (already added to the sheet).',
        '',
        'Order #' + number,
        'Name: ' + fullName,
        '',
        lines.map(function (l) { return l.qty + ' x ' + l.brand + ' ' + l.name + ' at $' + l.price.toFixed(2) + ' = $' + l.total.toFixed(2); }).join('\n'),
        '',
        'Total: $' + total.toFixed(2),
        note ? 'Note: ' + note : '',
        '',
        'Screenshot: ' + file.getUrl(),
        'All orders: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      ].join('\n'),
      attachments: [blob],
    });
  } catch (err) {
    // The order is already saved; a mail failure (quota, bad address) must not fail it.
  }
}

function screenshotFolder(settings) {
  const id = String(settings['Screenshot folder ID'] || '').trim();
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (err) {
      // folder was deleted; make a new one
    }
  }
  const folder = DriveApp.createFolder(SCREENSHOT_FOLDER_NAME);
  writeSetting('Screenshot folder ID', folder.getId());
  return folder;
}

function extensionFor(type) {
  const map = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif' };
  return map[type] || 'img';
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Settings

function readSettings() {
  const sheet = ensureSheets().settings;
  const rows = sheet.getDataRange().getValues();
  const settings = {};
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]) settings[String(rows[i][0]).trim()] = rows[i][1];
  }
  return settings;
}

function writeSetting(key, value) {
  const sheet = ensureSheets().settings;
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value]);
}

// ---------------------------------------------------------------------------
// Sheet setup (idempotent)

const SEED_SETTINGS = [
  ['Order password', DEFAULT_PASSWORD],
  ['Ordering open', true],
  ['Closed message', 'Ordering is closed right now. Check back before the next run.'],
  ['Payment instructions', 'Venmo the chapter treasurer and put your full name in the note.'],
  ['Notify email', DEFAULT_NOTIFY_EMAIL],
  ['Screenshot folder ID', ''],
];

// ID, Category, Brand, Name, Pack, Price, Available, Image, Sort
const SEED_PRODUCTS = [
  ['sc-classic-iced-tea', 'drinks', 'Sun Cruiser', 'Classic Iced Tea', '8-pack, 12 oz cans', 12, true, 'sc-classic-iced-tea.webp', 10],
  ['sc-half-and-half', 'drinks', 'Sun Cruiser', 'Half & Half', '8-pack, 12 oz cans', 12, true, 'sc-half-and-half.webp', 20],
  ['sc-peach-iced-tea', 'drinks', 'Sun Cruiser', 'Peach Iced Tea', '8-pack, 12 oz cans', 12, true, 'sc-peach-iced-tea.webp', 30],
  ['sc-raspberry-iced-tea', 'drinks', 'Sun Cruiser', 'Raspberry Iced Tea', '8-pack, 12 oz cans', 12, true, 'sc-raspberry-iced-tea.webp', 40],
  ['sc-classic-lemonade', 'drinks', 'Sun Cruiser', 'Classic Lemonade', '8-pack, 12 oz cans', 12, true, 'sc-classic-lemonade.webp', 50],
  ['sc-pink-lemonade', 'drinks', 'Sun Cruiser', 'Pink Lemonade', '8-pack, 12 oz cans', 12, true, 'sc-pink-lemonade.webp', 60],
  ['sc-strawberry-lemonade', 'drinks', 'Sun Cruiser', 'Strawberry Lemonade', '8-pack, 12 oz cans', 12, true, 'sc-strawberry-lemonade.webp', 70],
  ['sc-blueberry-lemonade', 'drinks', 'Sun Cruiser', 'Blueberry Lemonade', '8-pack, 12 oz cans', 12, true, 'sc-blueberry-lemonade.webp', 80],
  ['sc-variety-iced-tea', 'drinks', 'Sun Cruiser', 'Iced Tea Variety Pack', '8-pack, 12 oz cans', 12, true, 'sc-variety-iced-tea.webp', 90],
  ['sc-variety-lemonade', 'drinks', 'Sun Cruiser', 'Lemonade Variety Pack', '8-pack, 12 oz cans', 12, true, 'sc-variety-lemonade.webp', 100],
  ['tt-party-pack', 'drinks', 'Twisted Tea', 'Party Pack (Variety)', '12-pack, 12 oz cans', 17, true, 'tt-party-pack.png', 110],
  ['tt-light-party-pack', 'drinks', 'Twisted Tea', 'Light Party Pack (Variety)', '12-pack, 12 oz cans', 17, true, 'tt-light-party-pack.png', 120],
  ['sinless-variety', 'drinks', 'Sinless', 'Sinless Variety Pack', '8-pack, 12 oz cans', 12, true, 'sinless-variety.png', 130],
];

function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const get = function (name) { return ss.getSheetByName(name) || ss.insertSheet(name); };
  const settings = get('Settings');
  const products = get('Products');
  const orders = get('Orders');
  const items = get('Items');
  const totals = get('Totals');

  if (settings.getLastRow() === 0) {
    settings.appendRow(['Setting', 'Value']);
    SEED_SETTINGS.forEach(function (row) { settings.appendRow(row); });
    settings.getRange('1:1').setFontWeight('bold');
    settings.setFrozenRows(1);
    settings.setColumnWidth(1, 200);
    settings.setColumnWidth(2, 420);
  }
  if (products.getLastRow() === 0) {
    products.appendRow(['ID', 'Category', 'Brand', 'Name', 'Pack', 'Price', 'Available', 'Image', 'Sort']);
    SEED_PRODUCTS.forEach(function (row) { products.appendRow(row); });
    products.getRange('1:1').setFontWeight('bold');
    products.setFrozenRows(1);
    products.getRange('G2:G').insertCheckboxes();
    products.getRange('F2:F').setNumberFormat('$0.00');
  }
  if (orders.getLastRow() === 0) {
    orders.appendRow(['Timestamp', 'Order #', 'First name', 'Last name', 'Items', 'Total', 'Note', 'Screenshot', 'Status', 'Admin note']);
    orders.getRange('1:1').setFontWeight('bold');
    orders.setFrozenRows(1);
    orders.getRange('F2:F').setNumberFormat('$0.00');
    orders.getRange('A2:A').setNumberFormat('M/d/yyyy h:mm');
    orders.getRange('I2:I').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build()
    );
    orders.setColumnWidth(5, 320);
    orders.setColumnWidth(8, 260);
  }
  if (items.getLastRow() === 0) {
    items.appendRow(['Timestamp', 'Order #', 'Product ID', 'Product', 'Qty', 'Unit price', 'Line total', 'Status', 'Counted qty', 'Paid qty', 'Delivered qty', 'Counted total']);
    items.getRange('1:1').setFontWeight('bold');
    items.setFrozenRows(1);
    items.getRange('F2:G').setNumberFormat('$0.00');
    items.getRange('L2:L').setNumberFormat('$0.00');
  }
  if (totals.getLastRow() === 0) {
    totals.getRange('A1:F1').setValues([['Product ID', 'Product', 'Ordered', 'Paid', 'Delivered', 'Revenue (not cancelled)']]);
    totals.getRange('A2:F2').setFormulas([[
      '=ARRAYFORMULA(IF(Products!A2:A="", "", Products!A2:A))',
      '=ARRAYFORMULA(IF(Products!A2:A="", "", Products!C2:C & " " & Products!D2:D))',
      '=ARRAYFORMULA(IF(A2:A="", "", SUMIF(Items!C:C, A2:A, Items!I:I)))',
      '=ARRAYFORMULA(IF(A2:A="", "", SUMIF(Items!C:C, A2:A, Items!J:J)))',
      '=ARRAYFORMULA(IF(A2:A="", "", SUMIF(Items!C:C, A2:A, Items!K:K)))',
      '=ARRAYFORMULA(IF(A2:A="", "", SUMIF(Items!C:C, A2:A, Items!L:L)))',
    ]]);
    totals.getRange('H1:I1').setValues([['Summary', '']]);
    totals.getRange('H2:I6').setValues([
      ['Orders', '=COUNTA(Orders!B2:B)'],
      ['Pending', '=COUNTIF(Orders!I2:I, "Pending")'],
      ['Paid', '=COUNTIF(Orders!I2:I, "Paid")'],
      ['Delivered', '=COUNTIF(Orders!I2:I, "Delivered")'],
      ['Revenue (not cancelled)', '=SUM(Items!L:L)'],
    ]);
    totals.getRange('1:1').setFontWeight('bold');
    totals.getRange('H1:H6').setFontWeight('bold');
    totals.setFrozenRows(1);
    totals.getRange('F2:F').setNumberFormat('$0.00');
    totals.getRange('I6').setNumberFormat('$0.00');
    totals.setColumnWidth(2, 260);
    totals.setColumnWidth(8, 200);
  }
  return { settings: settings, products: products, orders: orders, items: items, totals: totals };
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
