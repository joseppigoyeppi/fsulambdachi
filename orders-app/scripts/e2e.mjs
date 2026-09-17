// End-to-end smoke test of the static export, served the way GitHub Pages serves it.
// Starts the mock backend + static server itself. Run `npm run build` first.
// Usage: node scripts/e2e.mjs [shotsDir]
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = process.argv[2] ?? path.join(app, "e2e-shots");
mkdirSync(shots, { recursive: true });
const basePath = readFileSync(path.join(app, "next.config.ts"), "utf8").match(/BASE_PATH\s*=\s*"([^"]+)"/)[1];
const BASE = `http://localhost:8080${basePath}`;
const ADMIN = { username: "tarokh", password: "test-password" };
const png = path.join(app, "public/products/tt-party-pack.png");

async function launch() {
  try {
    return await chromium.launch({ channel: "msedge", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}
// BACKEND=gas runs the real Apps Script code through scripts/gas-harness.mjs instead of the mock.
const backend = process.env.BACKEND === "gas" ? "scripts/gas-harness.mjs" : "scripts/mock-backend.mjs";
console.log("backend:", backend);
const procs = [
  spawn(process.execPath, [path.join(app, backend)], { stdio: "ignore", env: { ...process.env, ADMIN_USERNAME: ADMIN.username, ADMIN_PASSWORD: ADMIN.password } }),
  spawn(process.execPath, [path.join(app, "scripts/static-server.mjs"), "8080"], { stdio: "ignore" }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on("exit", stop);
await new Promise((r) => setTimeout(r, 1200));

const shot = (page, name) => page.screenshot({ path: path.join(shots, `${name}.png`) });
const check = (label, ok) => console.log(`${ok ? "PASS" : "FAIL"} ${label}`);

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("favicon")) errors.push(m.text().slice(0, 200)); });

// --- Storefront -----------------------------------------------------------------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add Peach Iced Tea to cart" }).waitFor({ timeout: 20000 });
check("menu loads from backend at the hidden path", true);
check("page is noindex", (await page.locator('meta[name="robots"]').getAttribute("content"))?.includes("noindex"));
check("product images resolve under base path", await page.locator('#drinks img').first().evaluate((img) => img.complete && img.naturalWidth > 0 && img.src.includes("/zr-orders-")));
await page.getByRole("button", { name: "Add Peach Iced Tea to cart" }).click();
await page.getByRole("button", { name: "Add one more Peach Iced Tea" }).click();
await page.getByRole("button", { name: "Add Party Pack (Variety) to cart" }).click();
await page.getByRole("button", { name: /Open cart/ }).click();
await page.getByRole("dialog").waitFor();
const cartText = await page.getByRole("dialog").innerText();
check("cart totals ($24 + $17)", cartText.includes("$41"));
await page.getByRole("button", { name: "Continue to payment" }).click();
await page.getByLabel("First name").fill("Tarokh");
await page.setInputFiles("#screenshot", png);
check("submit disabled without last name", await page.getByRole("button", { name: "Submit order" }).isDisabled());
await page.getByLabel("Last name").fill("   ");
await page.evaluate(() => document.querySelector("form")?.requestSubmit());
await page.getByText("Enter your last name.").waitFor({ timeout: 15000 });
check("server validation keeps typed name", (await page.getByLabel("First name").inputValue()) === "Tarokh");
await page.getByLabel("Last name").fill("Bani");
await shot(page, "01-checkout");
await page.getByRole("button", { name: "Submit order" }).click();
await page.getByRole("heading", { name: "Order received" }).waitFor({ timeout: 20000 });
const orderNumber = (await page.getByRole("dialog").innerText()).match(/#(\d+)/)?.[1];
check("order accepted with number", orderNumber === "1001");
await shot(page, "02-success");
await page.getByRole("button", { name: "Done" }).click();
check("cart cleared", (await page.getByRole("button", { name: /Open cart, \d+ items/ }).count()) === 0);

await page.getByRole("button", { name: "Add Sinless Variety Pack to cart" }).click();
await page.getByRole("button", { name: /Open cart/ }).click();
await page.getByRole("button", { name: "Continue to payment" }).click();
await page.getByLabel("First name").fill("Sam");
await page.getByLabel("Last name").fill("Brother");
await page.setInputFiles("#screenshot", png);
await page.getByRole("button", { name: "Submit order" }).click();
await page.getByRole("heading", { name: "Order received" }).waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Done" }).click();

// --- Admin -------------------------------------------------------------------------
await page.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
await page.getByLabel("Username").fill(ADMIN.username);
await page.getByLabel("Password").fill("wrong");
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByText("Wrong username or password.").waitFor();
check("wrong password rejected", true);
await page.getByLabel("Password").fill(ADMIN.password);
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByRole("heading", { name: "The count" }).waitFor({ timeout: 20000 });
await page.waitForTimeout(400);
await shot(page, "03-dashboard");
const dash = await page.locator("main").innerText();
check("dashboard: 2 orders, peach total 2", /total orders\s*2/i.test(dash) && /Peach Iced Tea[\s\S]*?2\s+-\s+-\s+2/.test(dash));

await page.goto(`${BASE}/admin/orders/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Open order #1001/ }).waitFor({ timeout: 20000 });
check("orders list shows names", (await page.locator("main").innerText()).includes("Tarokh Bani"));
await page.getByLabel("Search orders by name").fill("bani");
await page.keyboard.press("Enter");
check("search narrows to Bani", (await page.locator("tbody tr").count()) === 1);
await page.getByRole("button", { name: /Open order #1001/ }).click();
await page.getByRole("heading", { name: "Tarokh Bani" }).waitFor();
const img = page.locator('img[alt^="Payment screenshot"]');
await img.waitFor({ timeout: 20000 });
check("screenshot loads via backend", await img.evaluate((i) => i.complete && i.naturalWidth > 0));
await shot(page, "04-order-detail");
await page.getByRole("button", { name: "Mark paid" }).click();
await page.getByRole("button", { name: "Mark delivered" }).waitFor({ timeout: 20000 });
check("status moves to paid", true);

// Anonymous access to admin data must fail.
const anon = await browser.newPage();
const res = await anon.request.get("http://localhost:8787/exec?action=orders");
check("anonymous admin request rejected", !(await res.json()).ok);
await anon.close();

// --- Products / settings -------------------------------------------------------
await page.goto(`${BASE}/admin/products/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Edit Peach Iced Tea" }).waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Edit Peach Iced Tea" }).click();
await page.locator('input[name="price"]').first().fill("13.50");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByRole("status").filter({ hasText: "Saved" }).waitFor({ timeout: 20000 });
await page.getByRole("button", { name: "Add to Merch" }).click();
await page.locator('input[name="name"]').last().fill("Zeta Rho Tee");
await page.locator('input[name="brand"]').last().fill("Zeta Rho");
await page.locator('input[name="price"]').last().fill("25");
await page.getByRole("button", { name: "Add product" }).click();
await page.getByRole("status").filter({ hasText: "Saved" }).waitFor({ timeout: 20000 });
await shot(page, "05-products");
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Add Zeta Rho Tee to cart" }).waitFor({ timeout: 20000 });
const body = await page.locator("body").innerText();
check("store shows new price and merch item", body.includes("$13.50") && body.includes("Zeta Rho Tee"));

await page.goto(`${BASE}/admin/settings/`, { waitUntil: "networkidle" });
await page.getByLabel("How to pay").waitFor({ timeout: 20000 });
await page.getByLabel("How to pay").fill("Venmo @ZetaRho-Treasurer and put your full name in the note.");
await page.getByRole("button", { name: "Save settings" }).click();
await page.getByText("Saved").waitFor({ timeout: 20000 });
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.getByText("@ZetaRho-Treasurer").first().waitFor({ timeout: 20000 });
check("store shows new payment text", true);

// --- Log out; token gone --------------------------------------------------------
await page.goto(`${BASE}/admin/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Log out/ }).waitFor({ timeout: 20000 });
await page.getByRole("button", { name: /Log out/ }).click();
await page.getByRole("heading", { name: "Chapter admin" }).waitFor();
check("logout returns to login", true);

// --- Mobile ---------------------------------------------------------------------
const mobile = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, colorScheme: "dark" });
await mobile.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: "Add Half & Half to cart" }).waitFor({ timeout: 20000 });
await mobile.waitForTimeout(1500);
await shot(mobile, "06-mobile");
check("mobile: no horizontal overflow", !(await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));

console.log("errors:", errors.length ? errors : "none");
await browser.close();
stop();
console.log("E2E DONE");
