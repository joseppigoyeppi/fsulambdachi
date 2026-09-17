// Local stand-in for apps-script/orders-backend.gs. Same actions, same JSON shapes,
// in-memory data seeded from seed.json (screenshots kept in memory too).
// Usage: node scripts/mock-backend.mjs [port]   (default 8787)
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(path.join(here, "seed.json"), "utf8"));
const PORT = Number(process.argv[2] ?? process.env.MOCK_PORT ?? 8787);
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "tarokh";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test-password";
const MEMBER_SECRET = "mock-member-secret";

const now = () => new Date().toISOString();
const db = {
  settings: { ...seed.settings, accessCode: "ZETARHO" },
  members: [
    { firstName: "Tarokh", lastName: "Bani" },
    { firstName: "Sam", lastName: "Brother" },
  ],
  products: seed.products.map((p, i) => ({ available: true, sortOrder: i, createdAt: now(), updatedAt: now(), ...p })),
  orders: [],
  runs: [{ name: seed.settings.runName, code: "ZETARHO", startedAt: now() }],
  files: new Map(), // id -> { type, data(base64) }
  tokens: new Set(),
};

const STATUSES = ["pending", "confirmed", "delivered", "cancelled"];
const sortProducts = (list) => [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
const brandsInOrder = () => {
  const present = [...new Set(db.products.map((p) => p.brand))];
  return [...db.settings.brandOrder.filter((b) => present.includes(b)), ...present.filter((b) => !db.settings.brandOrder.includes(b)).sort()];
};
const publicSettings = () => {
  const rest = { ...db.settings };
  delete rest.nextOrderNumber;
  delete rest.accessCode;
  return rest;
};

// ---- Member gate: signed stateless tokens that die when the code changes or the name is removed.
const norm = (v) => String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
const codeHash = () => createHmac("sha256", MEMBER_SECRET).update(norm(db.settings.accessCode)).digest("hex").slice(0, 12);
const sign = (payload) => createHmac("sha256", MEMBER_SECRET).update(payload).digest("base64url");
const issueMemberToken = (m) => {
  const payload = Buffer.from(JSON.stringify({ f: m.firstName, l: m.lastName, c: codeHash() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};
const findMember = (first, last) => db.members.find((m) => norm(m.firstName) === norm(first) && norm(m.lastName) === norm(last));
const requireMember = (token) => {
  const fail = () => { throw Object.assign(new Error("Please sign in first."), { code: "unauthorized" }); };
  if (!token || typeof token !== "string") fail();
  const [payload, sig] = token.split(".");
  if (!payload || sign(payload) !== sig) fail();
  let data;
  try { data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { fail(); }
  if (data.c !== codeHash()) fail();
  const member = findMember(data.f, data.l);
  if (!member) fail();
  return member;
};
const clean = (v, max = 80) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const requireAdmin = (token) => {
  if (!token || !db.tokens.has(token)) throw Object.assign(new Error("Please sign in again."), { code: "unauthorized" });
};

function handle(action, p) {
  switch (action) {
    case "ping":
      return { version: "mock" };
    case "memberLogin": {
      const first = clean(p.firstName, 40);
      const last = clean(p.lastName, 40);
      if (!first || !last) throw new Error("Enter your first and last name.");
      if (norm(p.code) !== norm(db.settings.accessCode)) throw new Error("Wrong access code.");
      const member = findMember(first, last);
      if (!member) throw new Error("That name is not on the list. Check the spelling, or ask the treasurer to add you.");
      return { token: issueMemberToken(member), firstName: member.firstName, lastName: member.lastName };
    }
    case "catalog":
      requireMember(p.token);
      return { products: sortProducts(db.products), settings: publicSettings() };
    case "leaderboard": {
      const m = requireMember(p.token);
      return leaderboardFor(m);
    }
    case "myOrders": {
      const m = requireMember(p.token);
      const mine = db.orders
        .filter((o) => norm(o.firstName) === norm(m.firstName) && norm(o.lastName) === norm(m.lastName))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((o) => { const copy = { ...o }; delete copy.screenshot; delete copy.adminNote; return copy; });
      return { orders: mine };
    }

    case "submitOrder": {
      const member = requireMember(p.token);
      const firstName = member.firstName;
      const lastName = member.lastName;
      if (!db.settings.storeOpen) throw new Error(db.settings.closedMessage || "Ordering is closed right now.");
      const lines = Array.isArray(p.items) ? p.items : [];
      if (lines.length === 0) throw new Error("Your cart is empty.");
      const shot = p.screenshot;
      if (!shot || !shot.data) throw new Error("Add a screenshot of your payment.");
      if (!/^image\//.test(shot.type || "")) throw new Error("That file is not an image. Upload a PNG, JPG, WebP, or HEIC screenshot.");
      if (shot.data.length > 14 * 1024 * 1024) throw new Error("That screenshot is over 10 MB. Try a smaller one.");
      const items = [];
      for (const line of lines) {
        const qty = Number(line.quantity);
        if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error("Bad quantity.");
        const product = db.products.find((x) => x.id === line.productId);
        if (!product) throw new Error("One of the drinks in your cart is no longer on the menu. Refresh and try again.");
        if (!product.available) throw new Error(`${product.name} just sold out. Remove it and try again.`);
        items.push({ productId: product.id, brand: product.brand, name: product.name, unitPriceCents: product.priceCents, quantity: qty });
      }
      const id = randomUUID();
      db.files.set(id, { type: shot.type, data: shot.data });
      const order = {
        id,
        number: db.settings.nextOrderNumber++,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        items,
        totalCents: items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
        screenshot: id,
        note: clean(p.note, 500),
        status: "pending",
        adminNote: "",
        run: db.settings.runName,
        createdAt: now(),
        updatedAt: now(),
      };
      db.orders.push(order);
      return { orderNumber: order.number, totalCents: order.totalCents, fullName: order.fullName, items };
    }

    case "login": {
      if (String(p.username ?? "").trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase() || p.password !== ADMIN_PASSWORD) {
        throw new Error("Wrong username or password.");
      }
      const token = randomUUID();
      db.tokens.add(token);
      return { token };
    }
    case "logout":
      db.tokens.delete(p.token);
      return {};
  }

  requireAdmin(p.token);
  const orderById = (id) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new Error("Order not found");
    return o;
  };

  switch (action) {
    case "admin":
      return { products: sortProducts(db.products), settings: db.settings, orders: [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), members: db.members, runs: [...db.runs].reverse() };
    case "saveMembers": {
      const list = Array.isArray(p.members) ? p.members : [];
      const seen = new Set();
      db.members = list
        .map((m) => ({ firstName: clean(m.firstName, 40), lastName: clean(m.lastName, 40) }))
        .filter((m) => m.firstName && m.lastName && !seen.has(norm(`${m.firstName} ${m.lastName}`)) && seen.add(norm(`${m.firstName} ${m.lastName}`)));
      return { members: db.members };
    }
    case "screenshot": {
      const f = db.files.get(p.id);
      if (!f) throw new Error("Screenshot not found");
      return { dataUrl: `data:${f.type};base64,${f.data}` };
    }
    case "setOrderStatus": {
      if (!STATUSES.includes(p.status)) throw new Error("Bad status");
      const o = orderById(p.id);
      o.status = p.status;
      o.updatedAt = now();
      return {};
    }
    case "setOrderAdminNote": {
      const o = orderById(p.id);
      o.adminNote = clean(p.adminNote, 500);
      o.updatedAt = now();
      return {};
    }
    case "deleteOrder": {
      const i = db.orders.findIndex((x) => x.id === p.id);
      if (i >= 0) {
        db.files.delete(db.orders[i].screenshot);
        db.orders.splice(i, 1);
      }
      return {};
    }
    case "saveProduct": {
      const input = p.product ?? {};
      const name = clean(input.name);
      const brand = clean(input.brand, 60);
      const priceCents = Number(input.priceCents);
      if (!name) throw new Error("Give the product a name.");
      if (!brand) throw new Error("Add a brand (e.g. Sun Cruiser).");
      if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error("Enter a valid price like 18.99.");
      let image = String(input.image ?? "").trim();
      if (p.imageUpload && p.imageUpload.data) {
        const fid = randomUUID();
        db.files.set(fid, { type: p.imageUpload.type, data: p.imageUpload.data });
        image = `data:${p.imageUpload.type};base64,${p.imageUpload.data}`;
      }
      const fields = {
        name,
        brand,
        category: input.category === "merch" ? "merch" : "drinks",
        tag: clean(input.tag),
        description: clean(input.description, 300),
        priceCents,
        image,
        imageFit: input.imageFit === "cover" ? "cover" : "contain",
        available: Boolean(input.available),
        updatedAt: now(),
      };
      const existing = input.id ? db.products.find((x) => x.id === input.id) : null;
      if (input.id && !existing) throw new Error("Product not found");
      if (existing) {
        Object.assign(existing, fields);
        return { product: existing };
      }
      let id = `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || randomUUID();
      if (db.products.some((x) => x.id === id)) id = `${id}-${randomUUID().slice(0, 6)}`;
      const created = { id, ...fields, sortOrder: db.products.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1, createdAt: now() };
      db.products.push(created);
      if (!db.settings.brandOrder.includes(brand)) db.settings.brandOrder.push(brand);
      return { product: created };
    }
    case "deleteProduct": {
      db.products = db.products.filter((x) => x.id !== p.id);
      return {};
    }
    case "setProductAvailability": {
      const x = db.products.find((q) => q.id === p.id);
      if (!x) throw new Error("Product not found");
      x.available = Boolean(p.available);
      x.updatedAt = now();
      return {};
    }
    case "moveProduct": {
      const ordered = sortProducts(db.products);
      const i = ordered.findIndex((x) => x.id === p.id);
      const j = i + (p.direction === "up" ? -1 : 1);
      if (i >= 0 && j >= 0 && j < ordered.length) {
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        ordered.forEach((x, k) => (x.sortOrder = k));
      }
      return {};
    }
    case "moveBrand": {
      const order = brandsInOrder();
      const i = order.indexOf(p.brand);
      const j = i + (p.direction === "up" ? -1 : 1);
      if (i >= 0 && j >= 0 && j < order.length) {
        [order[i], order[j]] = [order[j], order[i]];
        db.settings.brandOrder = order;
      }
      return {};
    }
    case "updateSettings": {
      const s = p.settings ?? {};
      const storeName = clean(s.storeName, 60);
      const paymentInstructions = String(s.paymentInstructions ?? "").trim().slice(0, 600);
      const accessCode = clean(s.accessCode, 40);
      const runName = clean(s.runName, 60);
      if (!storeName) throw new Error("Store name cannot be empty.");
      if (!paymentInstructions) throw new Error("Tell people how to pay — that text shows at checkout.");
      if (accessCode.length < 4) throw new Error("The access code needs at least 4 characters.");
      if (!runName) throw new Error("Give the current order run a name (e.g. Fall Smth).");
      // A new name or code starts a new entry in the run history.
      if (runName !== db.settings.runName || norm(accessCode) !== norm(db.settings.accessCode)) {
        db.runs.push({ name: runName, code: accessCode, startedAt: now() });
      }
      Object.assign(db.settings, {
        accessCode,
        runName,
        storeName,
        chapterName: clean(s.chapterName),
        tagline: clean(s.tagline, 200),
        paymentInstructions,
        closedMessage: clean(s.closedMessage, 200),
        storeOpen: Boolean(s.storeOpen),
      });
      return {};
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/** Top 10 by paid packs across all orders ever, plus where the caller stands. */
function leaderboardFor(me) {
  const tally = new Map();
  for (const o of db.orders) {
    if (o.status !== "confirmed" && o.status !== "delivered") continue;
    const key = norm(`${o.firstName} ${o.lastName}`);
    const entry = tally.get(key) ?? { firstName: o.firstName, lastName: o.lastName, packs: 0, orders: 0 };
    entry.packs += o.items.reduce((s, i) => s + i.quantity, 0);
    entry.orders += 1;
    tally.set(key, entry);
  }
  const ranked = [...tally.values()].sort((a, b) => b.packs - a.packs || a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  const myKey = norm(`${me.firstName} ${me.lastName}`);
  const position = ranked.findIndex((e) => norm(`${e.firstName} ${e.lastName}`) === myKey);
  return { top: ranked.slice(0, 10), me: position === -1 ? null : { position: position + 1, packs: ranked[position].packs }, totalBrothers: ranked.length };
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const send = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(body));
  };
  const run = (action, params) => {
    try {
      send(200, { ok: true, ...handle(action, params) });
    } catch (error) {
      send(200, { ok: false, error: error.message, code: error.code });
    }
  };
  if (req.method === "GET") {
    const params = Object.fromEntries(url.searchParams);
    return run(params.action, params);
  }
  if (req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      let payload = {};
      try {
        payload = JSON.parse(raw || "{}");
      } catch {
        return send(200, { ok: false, error: "Bad JSON" });
      }
      run(payload.action, payload);
    });
    return;
  }
  send(405, { ok: false, error: "Method not allowed" });
});

server.listen(PORT, () => console.log(`mock orders backend on http://localhost:${PORT}/exec (admin ${ADMIN_USERNAME} / ${ADMIN_PASSWORD})`));
