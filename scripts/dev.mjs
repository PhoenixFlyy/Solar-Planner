// Run web + api together with label-prefixed output, open the browser when
// the web server is reachable, and shut both down cleanly on Ctrl-C.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnLabeled, commandExists, log, warn } from "./lib/proc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_URL = "http://localhost:3000";

const children = [];

function startWeb() {
  return spawnLabeled("web", "pnpm", ["--filter", "web", "dev"], { cwd: root });
}

function startApi() {
  if (!commandExists("uv")) {
    warn("uv not found — starting web only. Install uv to run the API.");
    return null;
  }
  return spawnLabeled(
    "api",
    "uv",
    ["run", "uvicorn", "solar_api.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
    { cwd: join(root, "apps", "api") },
  );
}

async function waitForWeb(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status < 500) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return false;
}

async function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];
  try {
    spawnLabeled("open", cmd[0], cmd[1]);
  } catch {
    log(`Open ${url} in your browser.`);
  }
}

function shutdown() {
  for (const c of children) {
    if (c && !c.killed) c.kill();
  }
  process.exit(0);
}

async function main() {
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  children.push(startWeb());
  children.push(startApi());

  log("Waiting for web to be ready…");
  if (await waitForWeb(WEB_URL)) {
    log(`Web is up at ${WEB_URL} — opening browser.`);
    await openBrowser(WEB_URL);
  } else {
    warn(`Web did not become ready in time; open ${WEB_URL} manually.`);
  }
}

main();
