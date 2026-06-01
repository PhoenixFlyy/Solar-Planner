# ADR-0006: Free-tier development strategy

## Status

Accepted — 2026-06-01

## Context

The maintainer wants zero infrastructure cost during development. Costs
should appear only when real traffic justifies them. External paid APIs
must be avoided unless strictly necessary and explicitly approved.

## Decision

- **Local = always free.** Docker Compose runs `postgres+postgis`, `redis`,
  `minio`. Web via `next dev`, API via `uvicorn --reload`. External APIs are
  mocked or served from an aggressive disk cache (`hishel`).
- **Online preview = free tiers only:** Vercel Hobby (web), Fly.io Free
  (API), Supabase Free (Postgres+PostGIS, Auth, Storage), Sentry Developer,
  Umami Cloud Free.
- **Paid APIs gated:** Google Solar API stays inactive in MVP (future ADR
  with cost estimate); Mapbox avoided (MapLibre + OSM suffice); PVGIS,
  Photon, OSM Overpass are the free defaults.
- **Fly.io 256 MB constraint:** load `geopandas` only in the worker, never
  in the API process.

## Consequences

- Positive: No spend during development; features degrade gracefully when an
  optional service is unconfigured.
- Negative: Free tiers impose limits (Fly.io RAM, public API rate limits) →
  caching and worker-only heavy imports are mandatory, not optional.
- Neutral: A paid path exists for later (Supabase Pro, Fly.io scale, Google
  Solar) but requires a superseding ADR.

## Alternatives considered

- Paid managed infra from day one: rejected — unjustified cost pre-traffic.
- No online preview at all: rejected — preview deploys are useful for
  feedback and are achievable for free.
