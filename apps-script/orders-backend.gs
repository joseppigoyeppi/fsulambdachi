// Backend for the hidden drink-order page (/zr-orders-…/ in this repo).
// Lives in the chapter Google account, bound to the "Zeta Rho Orders" spreadsheet.
// Products, orders, and settings are rows in that sheet; payment screenshots go
// to a private Drive folder. The page calls this web app for everything, so
// nothing here needs a server. Deploy instructions: see README.md in this folder.
//
// Script properties (Project Settings > Script properties) — REQUIRED before deploying:
//   ADMIN_USERNAME  who can open /admin on the page (e.g. tarokh)
//   ADMIN_PASSWORD  their password
// setup() adds MEMBER_SECRET itself (signs the brothers' sign-in tokens). Leave it alone.
// Optional: NOTIFY_EMAIL below — set to '' to turn off the per-order email.
//
// Who can see the page: only names on the "members" tab, and only with the access
// code (settings tab / Admin > Settings). Both are edited from the page's admin area.

const NOTIFY_EMAIL = 'zeta.rho.zeta.lca@gmail.com';
const DRIVE_FOLDER = 'Zeta Rho Orders';
const SESSION_SECONDS = 21600; // 6 hours, the most the cache allows

const SHEETS = {
  products: ['id', 'category', 'brand', 'name', 'tag', 'description', 'priceCents', 'image', 'imageFit', 'available', 'sortOrder', 'createdAt', 'updatedAt'],
  orders: ['id', 'number', 'createdAt', 'updatedAt', 'firstName', 'lastName', 'status', 'totalCents', 'items', 'screenshotId', 'note', 'adminNote', 'run'],
  settings: ['key', 'value'],
  members: ['firstName', 'lastName', 'addedAt'],
  runs: ['name', 'code', 'startedAt'],
};

const DEFAULT_SETTINGS = {
  storeName: 'Zeta Rho Orders',
  chapterName: 'Lambda Chi Alpha · Zeta Rho',
  tagline: 'Pick your drinks, pay the chapter, upload the screenshot. Done.',
  paymentInstructions: 'Venmo the chapter treasurer (update this in Admin → Settings) and put your full name in the note.',
  storeOpen: true,
  closedMessage: 'Ordering is closed right now. Check back before the next run.',
  brandOrder: ['Sun Cruiser', 'Twisted Tea', 'Sinless'],
  nextOrderNumber: 1001,
  accessCode: 'ZETARHO',
  runName: 'First run',
};

// Starter menu, written the first time setup() runs. Edit prices on the page afterwards.
const SEED_PRODUCTS = [
  ['sc-classic-iced-tea', 'Sun Cruiser', 'Classic Iced Tea', '8-pack · 12 oz cans', 'Real brewed tea + vodka. 4.5% ABV, 100 cal, no bubbles.', 1200, 'products/sc-classic-iced-tea.webp', 'contain'],
  ['sc-half-and-half', 'Sun Cruiser', 'Half & Half', '8-pack · 12 oz cans', 'Lemonade + iced tea + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-half-and-half.webp', 'contain'],
  ['sc-peach-iced-tea', 'Sun Cruiser', 'Peach Iced Tea', '8-pack · 12 oz cans', 'Peach iced tea + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-peach-iced-tea.webp', 'contain'],
  ['sc-raspberry-iced-tea', 'Sun Cruiser', 'Raspberry Iced Tea', '8-pack · 12 oz cans', 'Raspberry iced tea + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-raspberry-iced-tea.webp', 'contain'],
  ['sc-classic-lemonade', 'Sun Cruiser', 'Classic Lemonade', '8-pack · 12 oz cans', 'Classic lemonade + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-classic-lemonade.webp', 'contain'],
  ['sc-pink-lemonade', 'Sun Cruiser', 'Pink Lemonade', '8-pack · 12 oz cans', 'Pink lemonade + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-pink-lemonade.webp', 'contain'],
  ['sc-strawberry-lemonade', 'Sun Cruiser', 'Strawberry Lemonade', '8-pack · 12 oz cans', 'Strawberry lemonade + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-strawberry-lemonade.webp', 'contain'],
  ['sc-blueberry-lemonade', 'Sun Cruiser', 'Blueberry Lemonade', '8-pack · 12 oz cans', 'Blueberry lemonade + vodka. 4.5% ABV, 100 cal.', 1200, 'products/sc-blueberry-lemonade.webp', 'contain'],
  ['sc-variety-iced-tea', 'Sun Cruiser', 'Iced Tea Variety Pack', '8-pack · 12 oz cans', '2 of each: Classic, Half & Half, Peach, Raspberry.', 1200, 'products/sc-variety-iced-tea.webp', 'contain'],
  ['sc-variety-lemonade', 'Sun Cruiser', 'Lemonade Variety Pack', '8-pack · 12 oz cans', '2 of each: Classic, Pink, Strawberry, Blueberry.', 1200, 'products/sc-variety-lemonade.webp', 'contain'],
  ['tt-party-pack', 'Twisted Tea', 'Party Pack (Variety)', '12-pack · 12 oz cans', 'Original, Half & Half, Rocket Pop, Lemonade. 5% ABV.', 1700, 'products/tt-party-pack.png', 'contain'],
  ['tt-light-party-pack', 'Twisted Tea', 'Light Party Pack (Variety)', '12-pack · 12 oz cans', 'Half & Half, Lemon, Raspberry, Peach. 4% ABV, 110 cal.', 1700, 'products/tt-light-party-pack.png', 'contain'],
  ['sinless-variety', 'Sinless', 'Sinless Variety Pack', '8-pack · 12 oz cans', 'Cranberry, Black Cherry, Peach, Pineapple. 5% ABV, 0 sugar, 100 cal.', 1200, 'products/sinless-variety.png', 'cover'],
];

const STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled'];

// ---------------------------------------------------------------------------
// One-time setup. Select "setup" in the function dropdown and click Run. It
// creates the three tabs, the Drive folders, and the starter menu, and asks for
// the Sheets/Drive/email permissions this script needs. Safe to run again later.
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (name) {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHEETS[name]);
      sheet.setFrozenRows(1);
    }
    // Plain-text columns: keeps ids, dates, and JSON exactly as written.
    sheet.getRange(1, 1, sheet.getMaxRows(), SHEETS[name].length).setNumberFormat('@');
  });
  const products = ss.getSheetByName('products');
  if (products.getLastRow() < 2) {
    const now = new Date().toISOString();
    SEED_PRODUCTS.forEach(function (p, i) {
      products.appendRow([p[0], 'drinks', p[1], p[2], p[3], p[4], p[5], p[6], p[7], 'TRUE', i, now, now]);
    });
  }
  const settings = readSettings();
  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    if (settings[key] === undefined) writeSetting(key, DEFAULT_SETTINGS[key]);
  });
  // Sheets created by an older version may be missing newer columns (e.g. orders.run).
  Object.keys(SHEETS).forEach(function (name) {
    const sheet = ss.getSheetByName(name);
    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    SHEETS[name].forEach(function (h, i) {
      if (headers[i] !== h) sheet.getRange(1, i + 1).setValue(h);
    });
  });
  if (ss.getSheetByName('runs').getLastRow() < 2) {
    const current = readSettings();
    ss.getSheetByName('runs').appendRow([current.runName, current.accessCode, new Date().toISOString()]);
  }
  getFolder('Screenshots');
  getFolder('Product images');
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MEMBER_SECRET')) props.setProperty('MEMBER_SECRET', Utilities.getUuid() + Utilities.getUuid());
  MailApp.getRemainingDailyQuota();
  Logger.log('Setup complete. Now add ADMIN_USERNAME and ADMIN_PASSWORD under Project Settings > Script properties, then deploy.');
}

// ---------------------------------------------------------------------------
// Web app entry points

function doGet(e) {
  return respond(function () {
    const p = e.parameter || {};
    switch (p.action) {
      case 'ping':
        return { version: 'apps-script' };
      case 'catalog':
        requireMember(p.token);
        return { products: listProducts(), settings: publicSettings() };
      case 'leaderboard':
        return leaderboardFor(requireMember(p.token));
      case 'myOrders': {
        // A brother's own history: no screenshot ids or admin notes leave the sheet.
        const me = requireMember(p.token);
        return {
          orders: listOrders()
            .filter(function (o) { return norm(o.firstName) === norm(me.firstName) && norm(o.lastName) === norm(me.lastName); })
            .map(function (o) { return { id: o.id, number: o.number, firstName: o.firstName, lastName: o.lastName, fullName: o.fullName, items: o.items, totalCents: o.totalCents, note: o.note, status: o.status, run: o.run, createdAt: o.createdAt, updatedAt: o.updatedAt }; }),
        };
      }
      case 'admin':
        requireAdmin(p.token);
        return { products: listProducts(), settings: readSettings(), orders: listOrders(), members: listMembers(), runs: listRuns() };
      case 'screenshot': {
        requireAdmin(p.token);
        const order = findOrder(p.id);
        const blob = DriveApp.getFileById(order.screenshotId).getBlob();
        return { dataUrl: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
      }
      default:
        throw new Error('Unknown action: ' + p.action);
    }
  });
}

function doPost(e) {
  return respond(function () {
    const p = JSON.parse((e.postData && e.postData.contents) || '{}');
    switch (p.action) {
      case 'memberLogin':
        return memberLogin(p);
      case 'submitOrder':
        return submitOrder(p);
      case 'login':
        return login(p);
      case 'logout':
        if (p.token) CacheService.getScriptCache().remove(p.token);
        return {};
    }
    requireAdmin(p.token);
    return withLock(function () {
      switch (p.action) {
        case 'setOrderStatus': {
          if (STATUSES.indexOf(p.status) === -1) throw new Error('Bad status');
          updateOrder(p.id, { status: p.status });
          return {};
        }
        case 'setOrderAdminNote':
          updateOrder(p.id, { adminNote: clean(p.adminNote, 500) });
          return {};
        case 'deleteOrder':
          return deleteOrder(p.id);
        case 'saveProduct':
          return { product: saveProduct(p.product || {}, p.imageUpload) };
        case 'deleteProduct':
          deleteRowById('products', p.id);
          return {};
        case 'setProductAvailability':
          updateProduct(p.id, { available: p.available ? 'TRUE' : 'FALSE' });
          return {};
        case 'moveProduct':
          return moveProduct(p.id, p.direction);
        case 'moveBrand':
          return moveBrand(p.brand, p.direction);
        case 'updateSettings':
          return updateSettings(p.settings || {});
        case 'saveMembers':
          return { members: saveMembers(p.members) };
        default:
          throw new Error('Unknown action: ' + p.action);
      }
    });
  });
}

function respond(fn) {
  let body;
  try {
    body = Object.assign({ ok: true }, fn());
  } catch (err) {
    body = { ok: false, error: String((err && err.message) || err), code: err && err.code };
  }
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Auth: one account from script properties, sessions in the script cache.

function login(p) {
  const props = PropertiesService.getScriptProperties();
  const username = props.getProperty('ADMIN_USERNAME') || 'admin';
  const password = props.getProperty('ADMIN_PASSWORD');
  if (!password) throw new Error('ADMIN_PASSWORD is not set in the script properties.');
  const userOk = String(p.username || '').trim().toLowerCase() === username.toLowerCase();
  const passOk = String(p.password || '') === password;
  if (!userOk || !passOk) throw new Error('Wrong username or password.');
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(token, '1', SESSION_SECONDS);
  return { token };
}

function requireAdmin(token) {
  if (!token || CacheService.getScriptCache().get(token) !== '1') {
    const err = new Error('Please sign in again.');
    err.code = 'unauthorized';
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Member gate. A brother signs in with first + last name (matched against the
// "members" tab, ignoring case and spacing) plus the shared access code. They get
// a signed token carrying the canonical name; it stays valid until the access code
// changes or the name is taken off the list — no sessions to expire.

function memberLogin(p) {
  const first = clean(p.firstName, 40);
  const last = clean(p.lastName, 40);
  if (!first || !last) throw new Error('Enter your first and last name.');
  const settings = readSettings();
  if (norm(p.code) !== norm(settings.accessCode)) throw new Error('Wrong access code.');
  const member = findMember(first, last);
  if (!member) throw new Error('That name is not on the list. Check the spelling, or ask the treasurer to add you.');
  return { token: issueMemberToken(member, settings.accessCode), firstName: member.firstName, lastName: member.lastName };
}

function requireMember(token) {
  const fail = function () {
    const err = new Error('Please sign in first.');
    err.code = 'unauthorized';
    throw err;
  };
  if (!token || typeof token !== 'string') fail();
  const parts = token.split('.');
  if (parts.length !== 2 || signMember(parts[0]) !== parts[1]) fail();
  let data;
  try {
    data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  } catch (err) {
    fail();
  }
  if (data.c !== codeHash(readSettings().accessCode)) fail();
  const member = findMember(data.f, data.l);
  if (!member) fail();
  return member;
}

function issueMemberToken(member, accessCode) {
  const payload = Utilities.base64EncodeWebSafe(JSON.stringify({ f: member.firstName, l: member.lastName, c: codeHash(accessCode) }));
  return payload + '.' + signMember(payload);
}

function memberSecret() {
  const secret = PropertiesService.getScriptProperties().getProperty('MEMBER_SECRET');
  if (!secret) throw new Error('MEMBER_SECRET is missing — run setup() once.');
  return secret;
}

function signMember(payload) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(payload, memberSecret()));
}

/** Short fingerprint of the access code, baked into tokens so changing the code signs everyone out. */
function codeHash(code) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature('code:' + norm(code), memberSecret())).slice(0, 16);
}

function norm(v) {
  return String(v == null ? '' : v).toLowerCase().replace(/\s+/g, ' ').trim();
}

function listMembers() {
  return readRows('members')
    .map(function (r) { return { firstName: String(r.firstName || ''), lastName: String(r.lastName || '') }; })
    .filter(function (m) { return m.firstName && m.lastName; });
}

function findMember(first, last) {
  return listMembers().filter(function (m) { return norm(m.firstName) === norm(first) && norm(m.lastName) === norm(last); })[0] || null;
}

/** Replaces the whole list. Blank or duplicate names are dropped. */
function saveMembers(list) {
  const seen = {};
  const members = (Array.isArray(list) ? list : [])
    .map(function (m) { return { firstName: clean(m && m.firstName, 40), lastName: clean(m && m.lastName, 40) }; })
    .filter(function (m) {
      const key = norm(m.firstName + ' ' + m.lastName);
      if (!m.firstName || !m.lastName || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  const s = sheet('members');
  if (s.getLastRow() > 1) s.deleteRows(2, s.getLastRow() - 1);
  const now = new Date().toISOString();
  members.forEach(function (m) { s.appendRow([m.firstName, m.lastName, now]); });
  return members;
}

// ---------------------------------------------------------------------------
// Orders

function submitOrder(p) {
  const member = requireMember(p.token);
  const firstName = member.firstName;
  const lastName = member.lastName;
  const shot = p.screenshot || {};
  if (!shot.data) throw new Error('Add a screenshot of your payment.');
  if (!/^image\//.test(String(shot.type || ''))) throw new Error('That file is not an image. Upload a PNG, JPG, WebP, or HEIC screenshot.');
  if (shot.data.length > 14 * 1024 * 1024) throw new Error('That screenshot is over 10 MB. Try a smaller one.');
  const lines = Array.isArray(p.items) ? p.items : [];
  if (!lines.length) throw new Error('Your cart is empty.');

  return withLock(function () {
    const settings = readSettings();
    if (!settings.storeOpen) throw new Error(settings.closedMessage || 'Ordering is closed right now.');
    const products = listProducts();
    const items = lines.map(function (line) {
      const qty = Number(line.quantity);
      if (!(qty >= 1 && qty <= 99 && Math.floor(qty) === qty)) throw new Error('Bad quantity.');
      const product = products.filter(function (x) { return x.id === line.productId; })[0];
      if (!product) throw new Error('One of the drinks in your cart is no longer on the menu. Refresh and try again.');
      if (!product.available) throw new Error(product.name + ' just sold out. Remove it and try again.');
      return { productId: product.id, brand: product.brand, name: product.name, unitPriceCents: product.priceCents, quantity: qty };
    });
    const totalCents = items.reduce(function (sum, i) { return sum + i.unitPriceCents * i.quantity; }, 0);

    const id = Utilities.getUuid();
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'image/gif': 'gif' }[shot.type] || 'png';
    const file = getFolder('Screenshots').createFile(
      Utilities.newBlob(Utilities.base64Decode(shot.data), shot.type, id + '.' + ext)
    );

    const number = Number(settings.nextOrderNumber) || 1001;
    const now = new Date().toISOString();
    const fullName = firstName + ' ' + lastName;
    appendRow('orders', {
      id: id,
      number: number,
      createdAt: now,
      updatedAt: now,
      firstName: firstName,
      lastName: lastName,
      status: 'pending',
      totalCents: totalCents,
      items: JSON.stringify(items),
      screenshotId: file.getId(),
      note: clean(p.note, 500),
      adminNote: '',
      run: settings.runName,
    });
    writeSetting('nextOrderNumber', number + 1);

    if (NOTIFY_EMAIL) {
      try {
        MailApp.sendEmail({
          to: NOTIFY_EMAIL,
          subject: 'Drink order #' + number + ': ' + fullName + ' ($' + (totalCents / 100).toFixed(2) + ')',
          body: [
            'New order on the hidden order page.',
            '',
            'Name: ' + fullName,
            'Order #: ' + number,
            'Items: ' + items.map(function (i) { return i.quantity + 'x ' + i.name; }).join(', '),
            'Total: $' + (totalCents / 100).toFixed(2),
            p.note ? 'Note: ' + clean(p.note, 500) : '',
            '',
            'Screenshot: ' + file.getUrl(),
            'All orders: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
          ].join('\n'),
        });
      } catch (err) {
        // A mail hiccup must never lose the order.
        Logger.log('Email failed: ' + err);
      }
    }
    return { orderNumber: number, totalCents: totalCents, fullName: fullName, items: items };
  });
}

function listOrders() {
  return readRows('orders')
    .map(function (r) {
      const first = String(r.firstName || '');
      const last = String(r.lastName || '');
      return {
        id: String(r.id),
        number: Number(r.number),
        firstName: first,
        lastName: last,
        fullName: (first + ' ' + last).trim(),
        items: parseJson(r.items, []),
        totalCents: Number(r.totalCents) || 0,
        screenshot: String(r.screenshotId || ''),
        note: String(r.note || ''),
        status: STATUSES.indexOf(r.status) === -1 ? 'pending' : r.status,
        adminNote: String(r.adminNote || ''),
        run: String(r.run || ''),
        createdAt: isoDate(r.createdAt),
        updatedAt: isoDate(r.updatedAt),
      };
    })
    .sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0; });
}

function findOrder(id) {
  const row = readRows('orders').filter(function (r) { return String(r.id) === String(id); })[0];
  if (!row) throw new Error('Order not found');
  return row;
}

function updateOrder(id, changes) {
  const row = findOrder(id);
  changes.updatedAt = new Date().toISOString();
  updateRow('orders', row._row, Object.assign({}, row, changes));
}

function deleteOrder(id) {
  const row = readRows('orders').filter(function (r) { return String(r.id) === String(id); })[0];
  if (!row) return {};
  try {
    if (row.screenshotId) DriveApp.getFileById(row.screenshotId).setTrashed(true);
  } catch (err) {
    Logger.log('Could not trash screenshot: ' + err);
  }
  sheet('orders').deleteRow(row._row);
  return {};
}

// ---------------------------------------------------------------------------
// Products

function listProducts() {
  return readRows('products')
    .map(function (r) {
      return {
        id: String(r.id),
        category: r.category === 'merch' ? 'merch' : 'drinks',
        brand: String(r.brand || ''),
        name: String(r.name || ''),
        tag: String(r.tag || ''),
        description: String(r.description || ''),
        priceCents: Number(r.priceCents) || 0,
        image: String(r.image || ''),
        imageFit: r.imageFit === 'cover' ? 'cover' : 'contain',
        available: isTrue(r.available),
        sortOrder: Number(r.sortOrder) || 0,
        createdAt: isoDate(r.createdAt),
        updatedAt: isoDate(r.updatedAt),
      };
    })
    .sort(function (a, b) { return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name); });
}

function saveProduct(input, imageUpload) {
  const name = clean(input.name, 80);
  const brand = clean(input.brand, 60);
  const priceCents = Number(input.priceCents);
  if (!name) throw new Error('Give the product a name.');
  if (!brand) throw new Error('Add a brand (e.g. Sun Cruiser).');
  if (!(priceCents >= 0 && Math.floor(priceCents) === priceCents)) throw new Error('Enter a valid price like 18.99.');

  let image = String(input.image || '').trim();
  if (imageUpload && imageUpload.data) {
    if (!/^image\//.test(String(imageUpload.type || ''))) throw new Error('That file is not an image.');
    const file = getFolder('Product images').createFile(
      Utilities.newBlob(Utilities.base64Decode(imageUpload.data), imageUpload.type, slug(name) + '-' + Date.now())
    );
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    image = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
  }

  const now = new Date().toISOString();
  const fields = {
    name: name,
    brand: brand,
    category: input.category === 'merch' ? 'merch' : 'drinks',
    tag: clean(input.tag, 80),
    description: clean(input.description, 300),
    priceCents: priceCents,
    image: image,
    imageFit: input.imageFit === 'cover' ? 'cover' : 'contain',
    available: input.available ? 'TRUE' : 'FALSE',
    updatedAt: now,
  };
  const rows = readRows('products');
  if (input.id) {
    const row = rows.filter(function (r) { return String(r.id) === String(input.id); })[0];
    if (!row) throw new Error('Product not found');
    updateRow('products', row._row, Object.assign({}, row, fields));
    return listProducts().filter(function (x) { return x.id === String(input.id); })[0];
  }
  let id = slug(brand + '-' + name) || Utilities.getUuid();
  if (rows.some(function (r) { return String(r.id) === id; })) id = id + '-' + Utilities.getUuid().slice(0, 6);
  const maxSort = rows.reduce(function (m, r) { return Math.max(m, Number(r.sortOrder) || 0); }, -1);
  appendRow('products', Object.assign({ id: id, sortOrder: maxSort + 1, createdAt: now }, fields));
  const settings = readSettings();
  if (settings.brandOrder.indexOf(brand) === -1) writeSetting('brandOrder', settings.brandOrder.concat([brand]));
  return listProducts().filter(function (x) { return x.id === id; })[0];
}

function updateProduct(id, changes) {
  const row = readRows('products').filter(function (r) { return String(r.id) === String(id); })[0];
  if (!row) throw new Error('Product not found');
  changes.updatedAt = new Date().toISOString();
  updateRow('products', row._row, Object.assign({}, row, changes));
}

function moveProduct(id, direction) {
  const ordered = listProducts();
  const i = ordered.map(function (x) { return x.id; }).indexOf(String(id));
  const j = i + (direction === 'up' ? -1 : 1);
  if (i === -1 || j < 0 || j >= ordered.length) return {};
  const tmp = ordered[i]; ordered[i] = ordered[j]; ordered[j] = tmp;
  const rows = readRows('products');
  ordered.forEach(function (x, k) {
    const row = rows.filter(function (r) { return String(r.id) === x.id; })[0];
    if (row && Number(row.sortOrder) !== k) updateRow('products', row._row, Object.assign({}, row, { sortOrder: k }));
  });
  return {};
}

function moveBrand(brand, direction) {
  const settings = readSettings();
  const present = [];
  listProducts().forEach(function (x) { if (present.indexOf(x.brand) === -1) present.push(x.brand); });
  const order = settings.brandOrder.filter(function (b) { return present.indexOf(b) !== -1; })
    .concat(present.filter(function (b) { return settings.brandOrder.indexOf(b) === -1; }).sort());
  const i = order.indexOf(brand);
  const j = i + (direction === 'up' ? -1 : 1);
  if (i === -1 || j < 0 || j >= order.length) return {};
  const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  writeSetting('brandOrder', order);
  return {};
}

// ---------------------------------------------------------------------------
// Settings

function readSettings() {
  const out = {};
  readRows('settings').forEach(function (r) {
    if (r.key !== '') out[r.key] = r.value;
  });
  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    if (out[key] === undefined) return;
    if (typeof DEFAULT_SETTINGS[key] === 'boolean') out[key] = isTrue(out[key]);
    else if (typeof DEFAULT_SETTINGS[key] === 'number') out[key] = Number(out[key]);
    else if (Array.isArray(DEFAULT_SETTINGS[key])) out[key] = parseJson(out[key], []);
    else out[key] = String(out[key]);
  });
  return Object.assign({}, DEFAULT_SETTINGS, out);
}

function publicSettings() {
  const s = readSettings();
  delete s.nextOrderNumber;
  delete s.accessCode;
  return s;
}

function writeSetting(key, value) {
  const stored = Array.isArray(value) ? JSON.stringify(value) : typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value);
  const row = readRows('settings').filter(function (r) { return r.key === key; })[0];
  if (row) sheet('settings').getRange(row._row, 2).setValue(stored);
  else sheet('settings').appendRow([key, stored]);
}

function updateSettings(s) {
  const storeName = clean(s.storeName, 60);
  const paymentInstructions = String(s.paymentInstructions || '').trim().slice(0, 600);
  const accessCode = clean(s.accessCode, 40);
  const runName = clean(s.runName, 60);
  if (!storeName) throw new Error('Store name cannot be empty.');
  if (!paymentInstructions) throw new Error('Tell people how to pay — that text shows at checkout.');
  if (accessCode.length < 4) throw new Error('The access code needs at least 4 characters.');
  if (!runName) throw new Error('Give the current order run a name (e.g. Fall Smth).');
  // A new name or code starts a new entry in the run history.
  const current = readSettings();
  if (runName !== current.runName || norm(accessCode) !== norm(current.accessCode)) {
    sheet('runs').appendRow([runName, accessCode, new Date().toISOString()]);
  }
  writeSetting('accessCode', accessCode);
  writeSetting('runName', runName);
  writeSetting('storeName', storeName);
  writeSetting('chapterName', clean(s.chapterName, 80));
  writeSetting('tagline', clean(s.tagline, 200));
  writeSetting('paymentInstructions', paymentInstructions);
  writeSetting('closedMessage', clean(s.closedMessage, 200));
  writeSetting('storeOpen', Boolean(s.storeOpen));
  return {};
}

function listRuns() {
  return readRows('runs')
    .map(function (r) { return { name: String(r.name || ''), code: String(r.code || ''), startedAt: isoDate(r.startedAt) }; })
    .reverse();
}

/** Top 10 by paid packs across every order ever placed, plus where the caller stands. */
function leaderboardFor(me) {
  const tally = {};
  const order = [];
  listOrders().forEach(function (o) {
    if (o.status !== 'confirmed' && o.status !== 'delivered') return;
    const key = norm(o.firstName + ' ' + o.lastName);
    if (!tally[key]) {
      tally[key] = { firstName: o.firstName, lastName: o.lastName, packs: 0, orders: 0 };
      order.push(key);
    }
    tally[key].packs += o.items.reduce(function (s, i) { return s + i.quantity; }, 0);
    tally[key].orders += 1;
  });
  const ranked = order.map(function (k) { return tally[k]; }).sort(function (a, b) {
    return b.packs - a.packs || a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
  });
  const myKey = norm(me.firstName + ' ' + me.lastName);
  let position = -1;
  ranked.forEach(function (e, i) { if (position === -1 && norm(e.firstName + ' ' + e.lastName) === myKey) position = i; });
  return {
    top: ranked.slice(0, 10),
    me: position === -1 ? null : { position: position + 1, packs: ranked[position].packs },
    totalBrothers: ranked.length,
  };
}

// ---------------------------------------------------------------------------
// Sheet + Drive helpers

function sheet(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error('Sheet "' + name + '" is missing — run setup() first.');
  return s;
}

/** Rows as objects keyed by the header row, plus _row (1-based sheet row). */
function readRows(name) {
  const values = sheet(name).getDataRange().getValues();
  const headers = values[0] || SHEETS[name];
  return values.slice(1)
    .map(function (r, i) {
      const o = { _row: i + 2 };
      headers.forEach(function (h, j) { o[h] = r[j]; });
      return o;
    })
    .filter(function (o) { return String(o[headers[0]]) !== ''; });
}

function appendRow(name, obj) {
  sheet(name).appendRow(SHEETS[name].map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
}

function updateRow(name, row, obj) {
  const headers = SHEETS[name];
  sheet(name).getRange(row, 1, 1, headers.length).setValues([headers.map(function (h) { return obj[h] === undefined ? '' : obj[h]; })]);
}

function deleteRowById(name, id) {
  const row = readRows(name).filter(function (r) { return String(r.id) === String(id); })[0];
  if (row) sheet(name).deleteRow(row._row);
}

function getFolder(sub) {
  const rootIt = DriveApp.getFoldersByName(DRIVE_FOLDER);
  const root = rootIt.hasNext() ? rootIt.next() : DriveApp.createFolder(DRIVE_FOLDER);
  const subIt = root.getFoldersByName(sub);
  return subIt.hasNext() ? subIt.next() : root.createFolder(sub);
}

function withLock(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
}

function slug(v) {
  return String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
}

function isTrue(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

function isoDate(v) {
  if (v instanceof Date) return v.toISOString();
  const s = String(v || '');
  return s;
}

function parseJson(v, fallback) {
  try {
    return v ? JSON.parse(String(v)) : fallback;
  } catch (err) {
    return fallback;
  }
}
