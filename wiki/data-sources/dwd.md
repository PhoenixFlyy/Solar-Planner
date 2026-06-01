# DWD (Deutscher Wetterdienst)

German national weather service. Open data portal with historical and
reference climate datasets. **Complementary** to PVGIS, not a yield source
in MVP.

- Open data: `https://opendata.dwd.de`
- Cost: free.

## Possible uses (mostly Phase 2+)

- Local temperature series → temperature-corrected module efficiency.
- Regional irradiation cross-checks against PVGIS.
- Typical weather context for charts ("a sunny year vs. an average year").

## Status in MVP

Not wired in MVP. PVGIS already bundles the irradiation needed for yield
(see [ADR-0004](../../architecture/adrs/0004-pvgis-primary-yield-source.md)).
This page is a placeholder for when temperature correction or a "weather
year" feature is added.

## Pitfalls (for later)

- Raw DWD files are large and station-based — needs spatial interpolation
  (do it in the worker, not the API process; mind the Fly.io 256 MB limit).
- Formats vary by product (CDC archives, NetCDF, CSV). Document the exact
  product when an adapter is written.
