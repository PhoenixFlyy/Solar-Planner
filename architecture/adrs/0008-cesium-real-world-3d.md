# ADR-0008: Cesium for real-world 3D context

## Status

Accepted — 2026-06-01 (supersedes part of [ADR-0003](./0003-3d-engine-r3f.md))

## Context

ADR-0003 chose React Three Fiber for a schematic 3D editor and explicitly
deferred Cesium / 3D-tiles to Phase 3. The maintainer asked to embed the
planned house in the **real-world environment** (terrain + neighbouring
buildings) for a far more realistic view. This pulls the Phase 3 idea forward.

True photorealistic tiles (Google Photorealistic 3D Tiles) are a **paid**
Google Cloud API — out of the free-during-dev strategy (ADR-0006). Cesium
**ion** has a free tier (terrain + Cesium OSM Buildings) requiring only a
free access token.

## Decision

Add an **optional Cesium real-world view** alongside the R3F editor:

- React Three Fiber **remains the editor** (templates, panels, obstacles,
  sun/shadows). It is the default and the only view when no token is set.
- A **Cesium ion** view (via `resium`) shows world terrain + Cesium OSM
  Buildings at the project location, gated on `NEXT_PUBLIC_CESIUM_ION_TOKEN`.
  Without the token the toggle is hidden and nothing Cesium loads.
- Google Photorealistic 3D Tiles stays **out** (paid) until a future ADR with
  a cost estimate and maintainer confirmation.

## Consequences

- Positive: realistic real-world context for free; editor unchanged; clean
  degradation without a token.
- Negative: Cesium is a large dependency (static assets copied to
  `public/cesium`); a second 3D stack to maintain; the editor's schematic
  house is not (yet) fused into the Cesium scene — it's a context view.
- Neutral: deploys must run the Cesium asset copy step; token is per-deploy.

## Alternatives considered

- Google Photorealistic 3D Tiles: rejected for now — paid (ADR-0006 / Ask-
  before).
- Stay pure R3F (upgraded sky/shadows/materials): kept as the no-token
  fallback, but doesn't meet the "real-world environment" ask on its own.
- MapLibre 3D / maptiler terrain: weaker 3D-building coverage than Cesium OSM
  Buildings for DE.
