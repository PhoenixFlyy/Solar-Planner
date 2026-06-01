# Sprint 0 — Bootstrap Recap

*Date: 2026-06-01 · Branch: `sprint-0-bootstrap` · Status: awaiting sign-off*

Sprint 0 (Part 10 of `INITIAL_PROMPT.md`) is complete and verified locally.
This page records what was built, what was verified, the rulings/deviations
taken, and what the maintainer must do before Sprint 1.

## What was built

| Step | Deliverable | Commit |
|---|---|---|
| 10.1 | Bootstrap docs + root config (.gitignore, .gitattributes, .editorconfig, .nvmrc, .python-version, .env.example) | `eebdb0c` |
| 10.1 | 7 ADRs + ADR template + module-docs template + wiki | `f352c19` |
| 10.1 | pnpm workspace, root scripts, husky + lint-staged, shared-types skeleton | `2d07965` |
| 10.3 | FastAPI backend skeleton (health, settings, SQLModel User + Alembic, Dockerfile) | `bb1f92c` |
| 10.4 | Local docker-compose (postgis, redis, minio) | `e3a56ed` |
| 10.2 | Next.js 15 frontend skeleton (Tailwind 4, next-intl, TanStack Query, landing, /api-health) | `02ae67f` |
| 10.6 | Geo backend (Photon + Overpass adapters, geo router, tests) | `c66b35a` |
| 10.5 | OpenAPI→TS codegen output + codegen-sync workflow | `87d0c10`, `84fcddd` |
| 10.6 | Planer page (address→footprint→MapLibre), Dexie persistence, Playwright smoke | `415b706` |
| 10.7 | CI workflow (web + api + e2e) | `81184bc` |

## Verification (all green locally)

- **Backend:** `uv sync` (64 pkgs incl. pvlib/geopandas), `pytest` → **7 passed**,
  `mypy --strict` → clean, `ruff check` + `ruff format --check` → clean.
- **Frontend:** `tsc --noEmit` clean, `eslint` clean, `vitest` → **2 passed**,
  `next build` → all routes prerendered (`/`, `/api-health`, `/planer` in de+en).
- **Walking skeleton:** Playwright e2e → **1 passed** (address → geocode →
  footprint on map → survives reload; geo API mocked).
- **Codegen:** offline dump + `openapi-typescript` reproducible; `git diff`
  on `packages/shared-types` is clean after regeneration.
- **Tooling:** `pnpm install --frozen-lockfile` in sync; `docker compose
  config` parses; husky pre-commit runs ruff/prettier on staged files.

## Discrepancy rulings (maintainer-confirmed)

1. **pnpm is canonical**, not npm. ADR-0005 is the authority; the source
   plan's README used `npm` and was reconciled to `pnpm`. Project scripts are
   invoked `pnpm run <script>` (`pnpm setup` is reserved → use `pnpm run setup`).
2. **Web dev port = 3000** (Next.js default), overriding the `5173` in the
   source plan, per maintainer. README Port Map updated.

## Deviations from the source plan (with reasons)

These differ from a literal reading of Part 4/10 and should be reviewed:

- **next-intl v4** (plan implied a 3.x line). 3.x has no `^3.28`; the code
  uses the modern API (`defineRouting`/`createNavigation`/`requestLocale`)
  which is v4-native. No ADR needed (same library).
- **recharts v3** (v2.15 is deprecated on npm). Unused until Sprint 1.
- **hishel pinned `<1.0`.** hishel 1.x is a proxy/sqlite rewrite; the 0.x
  httpx disk-cache client (`AsyncCacheClient` + `AsyncFileStorage` +
  `Controller`) is what CLAUDE.md's adapter contract assumes.
- **Lint via the ESLint CLI**, not `next lint` (deprecated, removed in Next
  16). Flat config (`eslint.config.mjs`) extends `next/core-web-vitals` +
  `next/typescript`.
- **Codegen is offline** (imports the app and dumps `app.openapi()`) rather
  than hitting a running `/openapi.json`. More robust for CI; same output.
- **`.npmrc` hoists eslint/prettier** so Next's shared ESLint config resolves
  plugins under pnpm; **`pnpm.onlyBuiltDependencies`** allowlists native
  builds (esbuild/swc/sharp/unrs-resolver/@parcel/watcher).
- **CI has a third `e2e` job** (Playwright) beyond the plan's web+api jobs.
- **MapLibre uses the public OSM raster basemap** (free, no key) for dev.
  Heavy production traffic needs a dedicated tile host — revisit before
  launch.

None of these change a locked decision in a way that needs a superseding
ADR; flagged here for awareness. If any should be reverted, say so.

## Environment notes (this machine)

- **uv was not installed**; installed to `C:\Users\Felix\.local\bin`. Add
  that to your **persistent** PATH (the installer printed the command) so new
  shells and **git hooks** find `uv` — the husky pre-commit runs
  `uv run ... ruff` on staged Python and fails if `uv` is off PATH.
- Local `python` is the Microsoft Store **3.14** shim; the locked version is
  **3.12**. uv provisioned CPython 3.12.13 for the API venv, so this is fine
  — just don't rely on the system `python` for the API.
- mypy resolved to a 2.x line in this environment; strict passes.

## Maintainer setup checklist (fresh clone)

```bash
# 1. Install prerequisites: Node 22+, pnpm 10+, Docker, uv (persistent PATH).
# 2. Bootstrap:
pnpm install
pnpm run setup            # venv via uv, seed .env.local, codegen
# 3. Infra + migrations:
pnpm run dev:infra        # postgres+postgis, redis, minio
uv run --directory apps/api alembic upgrade head
# 4. Run:
pnpm run dev              # web :3000 + api :8000
```

## Not in Sprint 0 (expected)

- No real DB writes exercised beyond the migration (the slice persists to
  IndexedDB only).
- No arq worker yet (no background job exists; ADR-0001/0006 keep geopandas
  worker-only when one is added).
- shadcn components limited to button/card/input; the rest are added on
  demand via `pnpm dlx shadcn@latest add ...` in Sprint 1.
- No deploy (DEPLOYMENT.md is a stub by design).

## Sign-off

Per Part 10.8, **stopping here for maintainer sign-off before Sprint 1.**
Branch `sprint-0-bootstrap` is ready to review and merge to `main`.
