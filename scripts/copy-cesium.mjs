// Copy Cesium's runtime assets (Workers/Assets/Widgets/ThirdParty) into
// apps/web/public/cesium so the Cesium viewer can load them at runtime
// (CESIUM_BASE_URL = "/cesium"). Idempotent; safe to run repeatedly.
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { log, ok, warn } from "./lib/proc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webDir = join(root, "apps", "web");
const dest = join(webDir, "public", "cesium");
const require = createRequire(join(webDir, "package.json"));

function main() {
  let pkgJson;
  try {
    pkgJson = require.resolve("cesium/package.json");
  } catch {
    warn("cesium not installed — skipping asset copy.");
    return;
  }
  const buildDir = join(dirname(pkgJson), "Build", "Cesium");
  if (!existsSync(buildDir)) {
    warn(`Cesium build dir not found at ${buildDir} — skipping.`);
    return;
  }

  log("Copying Cesium runtime assets → apps/web/public/cesium …");
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const sub of ["Workers", "Assets", "Widgets", "ThirdParty"]) {
    const from = join(buildDir, sub);
    if (existsSync(from)) cpSync(from, join(dest, sub), { recursive: true });
  }
  ok("Cesium assets ready.");
}

main();
