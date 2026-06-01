# Photon

**Photon** — open-source geocoder by Komoot, backed by OpenStreetMap data.
Used for address → coordinates in the walking skeleton (Sprint 0.6).

- Base URL: `https://photon.komoot.io`
- Cost: free, no API key. (Self-hostable if rate limits bite.)

## What it provides

- `GET /api/?q=<query>&lang=de&limit=5` — forward geocoding. Returns GeoJSON
  `FeatureCollection`; each feature has `geometry.coordinates` `[lon, lat]`
  and `properties` (name, housenumber, street, city, postcode, country).
- `GET /reverse?lat=<lat>&lon=<lon>` — reverse geocoding.

## Pitfalls

- Coordinates are `[lon, lat]` (GeoJSON order), not `[lat, lon]`.
- Public instance has fair-use rate limits — cache and debounce input.
- Quality varies; bias to Germany with `lang=de` and filter by country.
- No SLA on the public instance; self-host for production traffic.

## Adapter

`apps/api/solar_api/adapters/photon.py`. Returns typed `GeocodeResult`
Pydantic models; never leaks raw GeoJSON to routers. Do **not** log the
query string (it is PII — an address). See [CLAUDE.md](../../CLAUDE.md).
