// Starts the mock backend and `next dev` together. Usage: npm run dev
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Run Next's own CLI entry with node directly: no shell, no .cmd shims, same on every OS.
const nextBin = path.join(app, "node_modules", "next", "dist", "bin", "next");
const procs = [
  spawn(process.execPath, [path.join(app, "scripts", "mock-backend.mjs")], { stdio: "inherit", cwd: app }),
  spawn(process.execPath, [nextBin, "dev"], { stdio: "inherit", cwd: app }),
];
const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
procs[1].on("exit", (code) => { stop(); process.exit(code ?? 0); });
