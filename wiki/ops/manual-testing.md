# Manual + Local Testing Guide

How to run Solar Planner locally and verify it by hand, including the Phase 2
features. Automated-test commands are in [testing.md](./testing.md); this page
adds the run + click-through.

## 0. Prerequisites

- Node.js 22+, pnpm 10+
- Python 3.12 + **uv** (the system `python` may be newer; uv pins 3.12)
- Docker Desktop (only needed for DB/Redis/MinIO — the planner itself runs
  without them)

> **Windows / uv on PATH:** uv installs to `C:\Users\<you>\.local\bin`. Make
> sure that's on PATH so `uv` resolves in new shells **and git hooks** (the
> pre-commit runs `uv ... ruff`). See `env-solar-planner-toolchain` memory.

## 1. Install

```bash
pnpm install
pnpm run setup        # venv via uv, seed .env.local, codegen
```

## 2. Run

The app needs the **web** + **api** processes. Infra (Postgres/Redis/MinIO)
is NOT required for the planner flow (no server-side persistence in MVP).

```bash
# both together (opens the browser at http://localhost:3000):
pnpm run dev

# or separately:
pnpm run dev:web      # http://localhost:3000
pnpm run dev:api      # http://localhost:8000  (uvicorn)
```

Optional infra + migration (only for future DB features):

```bash
pnpm run dev:infra
uv run --directory apps/api alembic upgrade head
```

> **Network:** geocoding (Photon), footprint (Overpass), yield (PVGIS) and the
> map tiles (OpenStreetMap) call **free public APIs** — an internet connection
> is needed for those steps. Responses are disk-cached by the API (`hishel`).

## 3. Automated checks (fast confidence)

```bash
pnpm test                       # web vitest + api pytest
pnpm --filter web typecheck     # tsc --noEmit
pnpm --filter web lint          # eslint
pnpm --filter web build         # production build (all routes prerender)
pnpm --filter web test:e2e      # Playwright (builds + starts; mocks the API)
uv run --directory apps/api mypy .     # strict types
uv run --directory apps/api ruff check .
```

Expected: web **52** vitest + **2** Playwright, api **16** pytest, all clean.

## 4. Manual walkthrough (full flow)

Open http://localhost:3000 (redirects to `/de`).

1. **Landing** → "Solar Planer starten". (Also try "Schnellrechner (mobil)".)
2. **API health:** visit `/de/api-health` → shows "API erreichbar" + version
   (confirms web↔api wiring; needs `dev:api` running).
3. **Standort (`/planer`):** type an address (e.g. *Brandenburger Tor,
   Berlin*) → Suchen → pick a result. A MapLibre map shows the building
   footprint (or "kein Gebäudeumriss" if OSM lacks it). **Reload the page** →
   the result is still there (IndexedDB persistence). → "Weiter: Dach".
4. **Dach (`/planer/dach`):**
   - Pick a template (Satteldach…). A 3D house appears.
   - Drag-orbit the camera. Move the param sliders → house updates live.
   - If a footprint exists: "Maße aus Gebäude übernehmen" snaps dimensions.
   - **Sun:** move the time slider + season buttons → the sun + shadows move.
   - **Module:** the count + kWp update; move the density slider; click a
     panel to remove it.
   - **Hindernisse:** click "Fenster"/"Schornstein", click a roof face to
     place, drag it (snaps); panels carve out around it; the count drops.
   - **Ertrags-Heatmap:** toggle → panels recolor blue→red by yield; annual
     kWh shows (PVGIS call). → "Weiter: Wirtschaftlichkeit".
5. **Wirtschaft (`/planer/wirtschaft`):**
   - Persons slider + EV/heat-pump toggles + storage slider → autarky,
     self-consumption, payback, savings update (hourly simulation).
   - Charts: cashflow (with payback marker), monthly bars, split pie.
   - **Profi-Modus:** toggle → edit electricity price / feed-in / €-per-kWp /
     storage € / subsidy → numbers + payback recompute. → "Weiter: Export".
6. **Export (`/planer/export`):**
   - **PDF** (summary + 3D screenshot + disclaimer), **XLSX** (3 sheets),
     **JSON** (download), **PNG** (3D), **Stunden-CSV** (8760 rows),
     **Link kopieren** (share URL).
   - **JSON importieren:** pick the JSON you exported → page reloads with the
     same project.
   - Paste the copied share link in a new tab → `/share` shows a read-only
     summary; "In meinen Planer laden" loads it.
7. **Reload anywhere** → the wizard keeps your data (IndexedDB).
8. **i18n:** swap `/de/` ↔ `/en/` in the URL → UI switches language.
9. **Footer/legal:** Impressum + Datenschutz links; consent banner appears
   once (stored locally), dismiss with "Verstanden".

## 5. Phase 2 spot-checks

- **Hourly CSV:** open the exported `solar-planner-hourly.csv` → 8760 data
  rows; `self + grid_import ≈ consumption`; `self + feed_in ≤ production`;
  battery `soc` rises on sunny surplus and falls in the evening.
- **Storage effect:** raise the storage slider on the economics step →
  autarky/self-consumption go up (and payback shifts).
- **Mobile quick-calc (`/schnellrechner`):** narrow the window → single-column
  layout; slide kWp/azimuth/tilt/demand → yield + payback update.

## 6. Reset

Clear site data (DevTools → Application → IndexedDB → delete `solar-planner`,
and Local Storage) to start fresh.
