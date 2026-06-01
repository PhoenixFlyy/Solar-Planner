# PVGIS

**Photovoltaic Geographical Information System** — EU Joint Research Centre.
Primary yield source (see [ADR-0004](../../architecture/adrs/0004-pvgis-primary-yield-source.md)).

- Base URL (v5.2): `https://re.jrc.ec.europa.eu/api/v5_2`
- Cost: free, no API key.
- Coverage: Europe (incl. all of Germany), Africa, most of Asia/Americas.

## What it provides

- `PVcalc` — grid-connected PV system energy yield (monthly + yearly) for a
  given location, peak power, tilt, azimuth, system loss, and mounting.
- `seriescalc` — hourly radiation / PV time series (for detail/Phase 2).
- `MRcalc` — monthly radiation.
- `tmy` — typical meteorological year.

Request `outputformat=json`. Key inputs: `lat`, `lon`, `peakpower` (kWp),
`loss` (%), `angle` (tilt °), `aspect` (azimuth °), `mountingplace`.

## Azimuth convention (IMPORTANT)

PVGIS `aspect`: **0 = south**, negative = east, positive = west
(−90 = E, +90 = W). This differs from pvlib's azimuth (0 = N, 90 = E,
180 = S, 270 = W). The adapter must convert. See
[solar/coordinates.md](../solar/coordinates.md).

## Pitfalls

- Public endpoint is rate-limited — cache aggressively (`hishel` disk cache)
  and query once per roof surface, then aggregate to system level.
- Cold-cache latency is noticeable; warm the cache for reference locations
  in tests rather than hitting the live API.
- `loss` already bundles several effects — don't double-count inverter loss.
- Validate every new yield calc against PVGIS for ≥3 reference locations
  (e.g. Berlin, Munich, Hamburg) per [CLAUDE.md](../../CLAUDE.md).

## Adapter

`apps/api/solar_api/adapters/pvgis.py` (Sprint 1, M1.5). Returns Pydantic
models, not raw dicts; converts azimuth frames; translates HTTP errors to a
domain exception.
