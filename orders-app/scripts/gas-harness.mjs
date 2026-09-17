// Runs apps-script/orders-backend.gs locally with fake Google services, so the
// real backend logic can be exercised by the e2e suite without deploying.
// Usage: node scripts/gas-harness.mjs [port]   (default 8787)
import { createServer } from "node:http";
import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.resolve(here, "../../apps-script/orders-backend.gs"), "utf8");
const PORT = Number(process.argv[2] ?? 8787);

// ---- Fake Sheets ---------------------------------------------------------------
class FakeSheet {
  constructor(name) {
    this.name = name;
    this.rows = [];
  }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map((r) => r.length)); }
  getMaxRows() { return Math.max(this.rows.length, 1000); }
  appendRow(values) { this.rows.push(values.map((v) => (v === undefined ? "" : v))); }
  setFrozenRows() {}
  getDataRange() { return this.getRange(1, 1, Math.max(this.rows.length, 1), Math.max(...this.rows.map((r) => r.length), 1)); }
  deleteRow(row) { this.rows.splice(row - 1, 1); }
  deleteRows(row, count) { this.rows.splice(row - 1, count); }
  getRange(row, col, numRows = 1, numCols = 1) {
    const rows = this.rows;
    const range = {
      getValues() {
        const out = [];
        for (let r = 0; r < numRows; r++) {
          const line = rows[row - 1 + r] ?? [];
          out.push(Array.from({ length: numCols }, (_, c) => (line[col - 1 + c] === undefined ? "" : line[col - 1 + c])));
        }
        return out;
      },
      setValues(values) {
        values.forEach((line, r) => {
          const idx = row - 1 + r;
          rows[idx] = rows[idx] ?? [];
          line.forEach((v, c) => (rows[idx][col - 1 + c] = v));
        });
      },
      setValue: (v) => range.setValues([[v]]),
      setNumberFormat: () => range,
    };
    return range;
  }
}
const sheets = new Map();
const SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getSheetByName: (name) => sheets.get(name) ?? null,
    insertSheet: (name) => { const s = new FakeSheet(name); sheets.set(name, s); return s; },
    getUrl: () => "https://docs.google.com/spreadsheets/d/fake",
  }),
};

// ---- Fake Drive ------------------------------------------------------------------
const files = new Map();
function iterator(list) { let i = 0; return { hasNext: () => i < list.length, next: () => list[i++] }; }
function makeFolder(name) {
  const folder = { name, children: [], files: [] };
  folder.getFoldersByName = (n) => iterator(folder.children.filter((c) => c.name === n));
  folder.createFolder = (n) => { const f = makeFolder(n); folder.children.push(f); return f; };
  folder.createFile = (blob) => {
    const id = randomUUID();
    const file = {
      getId: () => id,
      getUrl: () => `https://drive.google.com/file/d/${id}`,
      getBlob: () => blob,
      setSharing: () => file,
      setTrashed: () => file,
    };
    files.set(id, file);
    return file;
  };
  return folder;
}
const driveRoot = makeFolder("root");
const DriveApp = {
  getFoldersByName: (n) => driveRoot.getFoldersByName(n),
  createFolder: (n) => driveRoot.createFolder(n),
  getFileById: (id) => { const f = files.get(id); if (!f) throw new Error("File not found"); return f; },
  Access: { ANYONE_WITH_LINK: "anyone" },
  Permission: { VIEW: "view" },
};

// ---- Other services ---------------------------------------------------------------
const cache = new Map();
const CacheService = {
  getScriptCache: () => ({
    put: (k, v, ttl) => cache.set(k, { v, exp: Date.now() + ttl * 1000 }),
    get: (k) => { const e = cache.get(k); return e && e.exp > Date.now() ? e.v : null; },
    remove: (k) => cache.delete(k),
  }),
};
const props = { ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? "tarokh", ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "test-password" };
const PropertiesService = {
  getScriptProperties: () => ({
    getProperty: (k) => props[k] ?? null,
    setProperty: (k, v) => { props[k] = String(v); },
  }),
};
const LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
const toBytes = (v) => (Buffer.isBuffer(v) ? v : Buffer.from(String(v), "utf8"));
const Utilities = {
  getUuid: () => randomUUID(),
  base64Decode: (s) => Buffer.from(s, "base64"),
  base64Encode: (bytes) => toBytes(bytes).toString("base64"),
  base64EncodeWebSafe: (v) => toBytes(v).toString("base64url"),
  base64DecodeWebSafe: (s) => Buffer.from(s, "base64url"),
  computeHmacSha256Signature: (value, key) => createHmac("sha256", toBytes(key)).update(toBytes(value)).digest(),
  newBlob: (bytes, type, name) => ({ getBytes: () => bytes, getContentType: () => type, getName: () => name, getDataAsString: () => toBytes(bytes).toString("utf8") }),
};
const ContentService = {
  MimeType: { JSON: "json" },
  createTextOutput: (text) => ({ _text: text, setMimeType() { return this; } }),
};
const sentMail = [];
const MailApp = { sendEmail: (m) => sentMail.push(m), getRemainingDailyQuota: () => 100 };
const Logger = { log: (...a) => console.log("[gs]", ...a) };

// ---- Load the script -----------------------------------------------------------------
const context = { SpreadsheetApp, DriveApp, CacheService, PropertiesService, LockService, Utilities, ContentService, MailApp, Logger, console, Date, JSON, Math, Object, Array, String, Number, Boolean, Error, RegExp };
vm.createContext(context);
vm.runInContext(source, context, { filename: "orders-backend.gs" });
context.setup();
// Two brothers on the list so the gate can be exercised; the real sheet starts empty.
for (const [first, last] of [["Tarokh", "Bani"], ["Sam", "Brother"]]) sheets.get("members").appendRow([first, last, new Date().toISOString()]);
console.log("[harness] setup() done; products:", sheets.get("products").rows.length - 1, "members:", sheets.get("members").rows.length - 1);

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const finish = (output) => {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(output._text);
  };
  if (req.method === "GET") return finish(context.doGet({ parameter: Object.fromEntries(url.searchParams) }));
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => finish(context.doPost({ postData: { contents: raw } })));
}).listen(PORT, () => console.log(`[harness] orders-backend.gs on http://localhost:${PORT}/exec — ${sentMail.length} mails so far`));
