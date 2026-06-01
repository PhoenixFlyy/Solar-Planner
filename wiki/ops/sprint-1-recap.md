# Sprint 1 — MVP Recap

*Date: 2026-06-01 · Branch: `main` (pushed) · Status: M1.0–M1.7 + M1.9 done;
M1.8 deferred to Phase 2 (maintainer decision 2026-06-01)*

Sprint 1 (Part 11) built the gamified 3D planner + economics + exports on top
of Sprint 0. Worked directly on `main`, one commit per milestone, pushed.

## What was built

| Milestone | Deliverable | Commit |
|---|---|---|
| M1.0 | 5 roof templates + geometry, picker w/ SVG previews, schematic R3F house, param sliders, Dexie roof persistence | `cc107f1`, `9036c2c` |
| M1.1 | OSM footprint → building dimensions/orientation (min-area bbox), wizard nav | `fd92cfe` |
| M1.2 | pvlib sun endpoint + client NOAA sun (±1.5° vs pvlib), live light/shadows, time slider + seasons | `7e960ce` |
| M1.3 | Module auto-layout (instanced mesh), density slider, click-to-remove, count + kWp | `2178905` |
| M1.4 | Obstacles (window/chimney): place/drag (snap), auto-excluded from layout | `f33f889` |
| M1.5 | PVGIS yield endpoint + per-module heatmap, annual kWh | `7340e1c` |
| M1.6 | Consumption wizard + storage + economics (autarky/payback/cashflow) + Recharts | `ab6f42c` |
| M1.7 | Export hub: PDF, XLSX, JSON (+import), PNG, self-contained share-link + /share | `4e9a09d` |
| M1.9 | Footer disclaimer, consent banner, Impressum + Datenschutz, robots | `9910401` |
| M1.8 | **Deferred to Phase 2** (maintainer decision) — anon-first + the self-contained share-link cover MVP persistence/sharing | — |

## End-to-end flow (works today, offline + free)

Address → geocode + OSM footprint on a map → pick roof template → live 3D
house (adjust dimensions, sun moves across day/seasons with real shadows) →
auto-placed modules (density slider, click-to-remove) → drag windows/chimneys
that carve out area → PVGIS yield heatmap → consumption + storage + economics
with charts → export (PDF/XLSX/JSON/PNG/share-link). Everything persists in
IndexedDB and survives reload.

## Verification (local, all green)

- **Frontend:** vitest **45**, `tsc --noEmit`, eslint, `next build` (all
  routes prerendered), Playwright **2** (walking-skeleton + roof picker).
- **Backend:** pytest **16**, `mypy --strict`, ruff, `ruff format --check`.
- **CI on GitHub:** green for M1.0–M1.5 pushes; M1.6/M1.7/M1.9 pushes trigger
  the same `ci` + `codegen-sync` workflows.

## Deviations / decisions (flagged for review)

- **Compute split:** geometry, sun position, panel layout and economics are
  pure **client-side** TS libs (instant slider feedback, fully unit-tested);
  the backend holds the **authoritative** pieces (pvlib sun endpoint, PVGIS
  yield). The client NOAA sun is validated against pvlib (±1.5°). Consistent
  with the local-first principle.
- **Economics self-consumption** is a documented MVP heuristic (no hourly
  sim). Hourly BDEW × PVGIS is Phase 2.
- **Share-link** is **self-contained** (project encoded in the URL hash, no
  server). The tokenized Supabase share-link (`/share/<id>?token=<jwt>`) is
  part of M1.8.
- **New deps:** `jspdf`, `xlsx` (exports) and `@radix-ui/react-slider` — all
  permissively licensed, no paid service.
- **Legal pages** (Impressum/Datenschutz) are **TODO-marked placeholders**.
  The privacy text accurately describes current data flow, but the maintainer
  must fill real provider details and have both reviewed before any real
  launch. Disclaimer is shown in the footer and in every export.

## Open / needs maintainer input

- **M1.8 — optional Supabase account + sync. DEFERRED to Phase 2** (maintainer
  decision 2026-06-01). Adding Supabase Auth is an *"Ask before"* item (new
  core auth dependency) and needs a real project to verify; anon-first
  IndexedDB + the self-contained share-link already cover MVP persistence and
  sharing. Revisit when cross-device sync is actually needed.
- **CI deprecation:** GitHub will force Node 20 actions to Node 24 on
  2026-06-16. Current action majors still work; bump when newer majors ship.
- **Python 3.14 local shim vs locked 3.12** and **uv on PATH for git hooks**
  — see [[env-solar-planner-toolchain]] (memory) / sprint-0-recap.

## Suggested next

Decide M1.8, then Phase 2 (detail/pro mode, hourly sim, live tariffs, mobile
quick-calc). MoSCoW Must + Should for the MVP are now functionally complete.
