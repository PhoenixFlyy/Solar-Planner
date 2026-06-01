# ADR-0007: Roof-template-first approach

## Status

Accepted — 2026-06-01

## Context

A private homeowner cannot supply roof geometry parameters (azimuth in
degrees, tilt, eave/ridge heights) up front, and German OSM building data is
too patchy on height and roof shape to reconstruct a usable 3D house
automatically. The design principle is **template-first**: nobody should
have to type "azimuth" before they see a roof.

## Decision

The user picks a **roof template** (Satteldach, Pultdach, Walmdach,
Flachdach, Reihenhaus-Sattel) and configures parameters with sensible
defaults, mostly via sliders in the 3D editor. The OSM footprint, when
available, is an **optional input that constrains the template's ground
polygon**; without it, the user sets free dimensions. Templates live in
`apps/web/src/lib/templates/`, each exporting a `RoofTemplate` with `id`,
`name`, `previewImage`, `parameters`, and `buildGeometry(params)`.

## Consequences

- Positive: Instant, credible 3D house with zero geometry expertise; clean
  parameter model for the yield calc; works even where OSM data is missing.
- Negative: Templates approximate reality; complex/irregular roofs are not
  perfectly representable in MVP.
- Neutral: Footprint integration is additive — it refines, never blocks.

## Alternatives considered

- OSM-first (reconstruct house from OSM): rejected — height and roof shape
  in German OSM are too incomplete.
- Google Solar API (roof geometry from imagery): deferred — paid.
- Photogrammetry from user photos: deferred to Phase 4.
