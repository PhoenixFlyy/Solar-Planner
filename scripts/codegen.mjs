// Regenerate packages/shared-types from the FastAPI OpenAPI schema.
//
// Generated OFFLINE: we import the FastAPI app and dump app.openapi() to JSON
// (no running server needed), then run openapi-typescript on it. This keeps
// CI's codegen-sync check fast and serverless. CI fails if the result drifts
// from what is committed.
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { run, commandExists, log, ok } from "./lib/proc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...s) => join(root, ...s);

const OPENAPI_JSON = p("packages", "shared-types", "openapi.json");
const OUT_TS = p("packages", "shared-types", "src", "api.ts");

async function main() {
  if (!commandExists("uv")) {
    throw new Error("uv is required for codegen (it dumps the FastAPI schema). Install uv first.");
  }
  mkdirSync(p("packages", "shared-types", "src"), { recursive: true });

  log("Dumping OpenAPI schema from FastAPI app…");
  await run("uv", ["run", "python", join("scripts", "dump_openapi.py"), OPENAPI_JSON], {
    cwd: p("apps", "api"),
  });

  if (!existsSync(OPENAPI_JSON)) {
    throw new Error(`Schema not written to ${OPENAPI_JSON}`);
  }

  log("Generating TypeScript types (openapi-typescript)…");
  await run("pnpm", ["exec", "openapi-typescript", OPENAPI_JSON, "-o", OUT_TS], { cwd: root });
  ok(`Wrote ${OUT_TS}`);
}

main().catch((err) => {
  console.error(`\x1b[31m✗ codegen failed: ${err.message}\x1b[0m`);
  process.exit(1);
});
