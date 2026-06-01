# Phase 2 — Recap

*Date: 2026-06-01 · Branch: `main` (pushed)*

Phase 2 deepened the planner with an hourly simulation, richer load profiles,
detail-mode tariffs, hourly export, and a mobile quick-calc — staying
local-first + free (ADR-0006). Plus a CI maintenance bump.

## What was built

| Item | Deliverable | Commit |
|---|---|---|
| CI bump | actions → Node24-ready majors (checkout/setup-node/pnpm v6, setup-uv v8.1.0) | `e98dc0a`, `982ba70` |
| P2.1 | 8760-hour client simulation: PV shape (sun) scaled to PVGIS monthly, BDEW-H0 load + EV/heat-pump components, battery dispatch. Drives economics self-consumption/autarky | `515300d` |
| P2.2 | Hourly CSV export (8760 rows) in the export hub | `74ee75c` |
| P2.4 | Profi-Modus: editable electricity price, feed-in tariff, €/kWp, €/kWh storage, subsidy | `74ee75c` |
| P2.5 | `/schnellrechner` mobile quick-calc (no 3D), linked from landing | `74ee75c` |

## Verification (local, green)

- Frontend: vitest **52** (incl. 7 simulation), `tsc`, eslint, `next build`.
- Backend: pytest **16**, `mypy --strict`, ruff.
- CI: green on the bumped actions (only a benign cache-race warning).

## Deviations / deferrals (with reasons)

- **Self-consumption model** is now an hourly simulation over **synthetic**
  profiles (sun-driven PV scaled to PVGIS monthly; BDEW-H0-style load). It is
  a real dispatch sim, not the M1.6 heuristic, but the profiles are
  representative, not measured 15-min data. Good enough for planning; a
  standard/measured dataset is a later refinement.
- **Dynamic tariffs (Tibber/aWATTar)** — *not built.* Tibber needs a paid/
  account token (Ask-before). aWATTar is free (no key) and is the preferred
  future source; deferred to keep this batch bounded.
- **Live Förderdatenbank** — *not built.* No stable free API; the subsidy
  stays a single editable figure (now exposed in Profi-Modus).
- **Phase 3/4 items** (LoD2, Cesium/3D-tiles, neighbour shading, installer
  marketplace, ML roof segmentation) remain out of scope by the roadmap.
- **M1.8 (Supabase sync)** still deferred (Phase 2 decision stands).

## How to test

See **[manual-testing.md](./manual-testing.md)** for the full local +
manual walkthrough (setup, automated suites, click-through of every step
incl. the Phase 2 features).

## Suggested next

aWATTar dynamic tariffs (free) → variable-price savings; measured load
profiles; then Phase 3 (geospatial). Or M1.8 if cloud sync is wanted.
