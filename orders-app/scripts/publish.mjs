// Copies the static export (out/) into the hidden folder at the site repo root,
// named after BASE_PATH in next.config.ts. Run automatically by `npm run build`.
import { cpSync, existsSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.resolve(app, "..");
const config = readFileSync(path.join(app, "next.config.ts"), "utf8");
const basePath = config.match(/BASE_PATH\s*=\s*"([^"]+)"/)?.[1];
if (!basePath) throw new Error("BASE_PATH not found in next.config.ts");

const out = path.join(app, "out");
const target = path.join(site, basePath.replace(/^\//, ""));
if (!existsSync(out)) throw new Error("out/ is missing — run `next build` first");

// Keep the backend URL someone already pasted into the published config.js.
const endpointOf = (file) => (existsSync(file) ? readFileSync(file, "utf8").match(/endpoint:\s*"([^"]*)"/)?.[1] ?? "" : "");
const previousEndpoint = endpointOf(path.join(target, "config.js"));

rmSync(target, { recursive: true, force: true });
cpSync(out, target, { recursive: true });
flattenPrefetchDirs(target);

const configPath = path.join(target, "config.js");
if (previousEndpoint && !endpointOf(configPath)) {
  writeFileSync(configPath, readFileSync(configPath, "utf8").replace(/endpoint:\s*""/, `endpoint: "${previousEndpoint}"`));
  console.log("kept configured endpoint in config.js");
}
// GitHub Pages runs Jekyll by default, which drops any folder starting with "_" —
// including Next's _next/. This file switches Jekyll off for the whole site.
writeFileSync(path.join(site, ".nojekyll"), "");
console.log(`published ${basePath}/ -> ${target}`);

/*
  The Windows export writes segment prefetch payloads as "__next.admin/__PAGE__.txt"
  while the browser asks for "__next.admin.__PAGE__.txt". Flatten any "__next.*"
  directory into dot-joined file names so client-side navigation never 404s.
*/
function flattenPrefetchDirs(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      for (const rel of walk(full)) {
        renameSync(path.join(full, rel), path.join(dir, `${name}.${rel.split(path.sep).join(".")}`));
      }
      rmSync(full, { recursive: true, force: true });
    } else {
      flattenPrefetchDirs(full);
    }
  }
}

function walk(dir, prefix = "") {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const rel = prefix ? path.join(prefix, name) : name;
    return statSync(full).isDirectory() ? walk(full, rel) : [rel];
  });
}
