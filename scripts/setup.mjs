// Idempotent project setup. Safe to run repeatedly.
//   - verifies required tooling
//   - installs workspace JS deps (pnpm)
//   - creates the Python venv + deps via uv
//   - seeds .env.local (root + apps/web) from .env.example
//   - runs codegen
import { existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { run, commandExists, log, ok, warn } from "./lib/proc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(root, ...s);

async function main() {
  log("Checking tooling…");
  for (const tool of ["node", "pnpm"]) {
    if (!commandExists(tool)) {
      throw new Error(`Required tool not found on PATH: ${tool}`);
    }
  }
  const hasUv = commandExists("uv");
  if (!hasUv) {
    warn(
      "uv not found — skipping Python venv + API codegen. Install it:\n" +
        "    Windows: irm https://astral.sh/uv/install.ps1 | iex\n" +
        "    Unix:    curl -LsSf https://astral.sh/uv/install.sh | sh",
    );
  }
  if (!commandExists("docker")) {
    warn("docker not found — `pnpm run dev:infra` will not work until installed.");
  }

  log("Installing workspace JS dependencies (pnpm install)…");
  await run("pnpm", ["install"], { cwd: root });
  ok("JS dependencies installed.");

  log("Copying Cesium runtime assets…");
  await run("node", [p("scripts", "copy-cesium.mjs")], { cwd: root });

  if (hasUv) {
    log("Syncing Python environment (uv sync)…");
    await run("uv", ["sync"], { cwd: p("apps", "api") });
    ok("Python environment ready.");
  }

  log("Seeding .env.local files…");
  seedEnv(p(".env.example"), p(".env.local"));
  seedEnv(p(".env.example"), p("apps", "web", ".env.local"));

  if (hasUv) {
    log("Running codegen…");
    try {
      await run("node", [p("scripts", "codegen.mjs")], { cwd: root });
      ok("Generated shared types.");
    } catch {
      warn("codegen failed (ok on first run before deps build); rerun `pnpm run codegen` later.");
    }
  }

  ok("Setup complete. Next: `pnpm run dev:infra` then `pnpm run dev`.");
}

function seedEnv(from, to) {
  if (!existsSync(from)) {
    warn(`Missing ${from} — cannot seed ${to}.`);
    return;
  }
  if (existsSync(to)) {
    log(`${to} already exists — left untouched.`);
    return;
  }
  copyFileSync(from, to);
  ok(`Created ${to} from .env.example.`);
}

main().catch((err) => {
  console.error(`\x1b[31m✗ setup failed: ${err.message}\x1b[0m`);
  process.exit(1);
});
