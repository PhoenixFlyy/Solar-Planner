# Overpass / OpenStreetMap

**Overpass API** queries OpenStreetMap data. Used to fetch a building
**footprint** polygon near a coordinate (Sprint 0.6).

- Base URL: `https://overpass-api.de/api/interpreter`
- Cost: free, no API key.

## What it provides

Overpass QL over HTTP `POST`. To find buildings around a point:

```
[out:json][timeout:25];
(
  way["building"](around:30,<lat>,<lon>);
  relation["building"](around:30,<lat>,<lon>);
);
out body geom;
```

Returns elements with `geometry` (list of `{lat, lon}` nodes) forming the
building outline. Pick the polygon containing / nearest the query point.

## Pitfalls

- German OSM building data is **patchy on height and roof shape** — this is
  exactly why we are template-first, not OSM-first (see
  [ADR-0007](../../architecture/adrs/0007-roof-template-first.md)).
- Public Overpass instances rate-limit and occasionally 429/504 — cache,
  retry with backoff (Tenacity), and degrade gracefully when no footprint
  is found (fall back to free-dimension template input).
- Coordinates are `lat,lon`; mind axis order vs. GeoJSON `[lon,lat]`.
- Relations (multipolygons) need assembly; for MVP, a single outer way is
  usually enough.

## Adapter

`apps/api/solar_api/adapters/overpass.py`. Returns a typed `Footprint`
(list of lat/lng vertices) or `None`; translates HTTP errors to a domain
exception.
