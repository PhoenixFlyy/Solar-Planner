// Small cross-platform process helpers for the repo dev scripts.
// Kept dependency-free on purpose (these run before `pnpm install`).
import { spawn, spawnSync } from "node:child_process";

// On Windows, pnpm/uv/docker are .cmd/.ps1 shims — spawn needs a shell to
// resolve them. shell:true is required for portability here.
const SHELL = true;

/** Run a command, inheriting stdio. Resolves on exit 0, rejects otherwise. */
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: SHELL, ...opts });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve(0)
        : reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

/** Spawn a long-running command with a label-prefixed stdout/stderr. */
export function spawnLabeled(label, cmd, args = [], opts = {}) {
  const child = spawn(cmd, args, { shell: SHELL, ...opts });
  const prefix = (line) => `[${label}] ${line}`;
  const pipe = (stream, out) => {
    let buf = "";
    stream.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) out.write(prefix(l) + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  return child;
}

/** True if `cmd --version` (or `where/which`) succeeds. */
export function commandExists(cmd) {
  const probe = process.platform === "win32" ? "where" : "which";
  const res = spawnSync(probe, [cmd], { shell: SHELL, stdio: "ignore" });
  return res.status === 0;
}

export const log = (msg) => console.log(`\x1b[36m›\x1b[0m ${msg}`);
export const warn = (msg) => console.warn(`\x1b[33m! ${msg}\x1b[0m`);
export const ok = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
