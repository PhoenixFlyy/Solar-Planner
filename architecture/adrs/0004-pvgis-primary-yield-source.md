# ADR-0004: PVGIS as primary yield source

## Status

Accepted — 2026-06-01

## Context

We need credible, free PV yield estimates for any location in Germany (and
later the EU), broken down enough to drive monthly charts and a per-module
heatmap. Inputs a homeowner cannot supply (precise irradiation time series)
must come from an authoritative dataset, not guesses.

## Decision

Use **PVGIS** (EU JRC) as the primary yield data source, queried per roof
surface (lat/lng, tilt, azimuth) and aggregated to system level. pvlib is
the authoritative library for sun-position and any local PV math; custom
math is allowed only where pvlib does not cover the case, and must be
documented in the wiki and validated against PVGIS for ≥3 reference
locations. See `wiki/data-sources/pvgis.md`.

## Consequences

- Positive: Free, EU-official, well-validated irradiation + yield;
  per-surface granularity supports the heatmap; no API key.
- Negative: Public endpoint rate limits → must cache aggressively (`hishel`
  disk cache) and batch per surface; latency on cold cache.
- Neutral: DWD and BDEW remain complementary sources (weather context,
  load profiles), not replacements for PVGIS yield.

## Alternatives considered

- Google Solar API: deferred — paid; see
  `wiki/data-sources/google-solar-deferred.md` and a future ADR-0008.
- Self-rolled irradiation model from DWD raw data: rejected for MVP — large
  effort, must still be validated against PVGIS anyway.
