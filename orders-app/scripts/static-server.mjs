// Serves the site repo root like GitHub Pages does (index.html for folders,
// .html fallback for extensionless paths). Usage: node scripts/static-server.mjs [port]
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const port = Number(process.argv[2] ?? 8080);
const types = { html: "text/html", js: "text/javascript", css: "text/css", json: "application/json", png: "image/png", webp: "image/webp", svg: "image/svg+xml", jpg: "image/jpeg", ico: "image/x-icon", woff2: "font/woff2", txt: "text/plain", webmanifest: "application/manifest+json" };

createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
  else if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  if (!existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("404");
  }
  const ext = path.extname(file).slice(1);
  res.writeHead(200, { "Content-Type": types[ext] ?? "application/octet-stream" });
  // Local previews and tests must never hit the real backend: when MOCK_ENDPOINT is
  // set, the published config.js is served with that endpoint instead of the live one.
  if (path.basename(file) === "config.js" && process.env.MOCK_ENDPOINT) {
    return res.end(readFileSync(file, "utf8").replace(/endpoint:\s*"[^"]*"/, `endpoint: "${process.env.MOCK_ENDPOINT}"`));
  }
  res.end(readFileSync(file));
}).listen(port, () => console.log(`site at http://localhost:${port}/ (root ${root})`));
