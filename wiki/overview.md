# System Overview

Solar Planner is a web-first, all-in-one PV planning tool for German
homeowners. See [PROJECT.md](../PROJECT.md) for the product vision and
[architecture/adrs](../architecture/adrs) for decisions.

## Shape

```
Browser (Next.js 15, React 19)
  ├── 3D editor      React Three Fiber + drei        (gamified house + sun)
  ├── charts         Recharts                        (economics)
  ├── maps           MapLibre GL JS                  (locate building)
  ├── client state   Zustand                         (editor)
  ├── server state   TanStack Query                  (API calls)
  └── persistence    Dexie / IndexedDB               (anon-first, tier 1)
        │  optional account
        ▼
FastAPI (Python 3.12)
  ├── routers/       thin HTTP layer
  ├── services/      geo, solar, shading, economics, reports (business logic)
  ├── adapters/      external APIs (photon, overpass, pvgis, ...)
  ├── tasks/         arq background jobs (heavy work, e.g. geopandas)
  └── db/            SQLModel + Alembic → PostgreSQL 16 + PostGIS 3.4
        │  optional sync
        ▼
Supabase (online): Postgres + Auth + Storage (tier 2)
```

## Type-safety boundary

The single source of truth for API shapes is the FastAPI **OpenAPI** schema.
`pnpm run codegen` regenerates `packages/shared-types/` from it; CI fails if
the checked-in types are out of sync. Never hand-edit generated types.

## Persistence tiers

Anon-first (see [ADR-0002](../architecture/adrs/0002-anon-first-persistence.md)):
IndexedDB first, optional Supabase sync + share-link second, future lead-DB
third. The Dexie schema mirrors the backend schema.

## What is deliberately out of MVP

Neighbour-building shading, LoD2 data, Cesium/3D-tiles, image-based roof
segmentation, installer marketplace, live subsidy DB, hourly CSV export,
multiple projects per user, mobile 3D editor. See `INITIAL_PROMPT.md` Part 11.
