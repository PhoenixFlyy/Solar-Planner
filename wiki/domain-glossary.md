# Domain Glossary

Shared vocabulary across the codebase. Module-local terms belong in that
module's `_docs/glossary.md`.

## Solar / PV

- **kWp (kilowatt-peak)** — rated DC output of a PV array under standard
  test conditions. Drives PVGIS yield queries.
- **Yield** — energy a system produces over a period (kWh), from PVGIS.
- **Azimuth** — compass orientation of a surface. Project-canonical frame is
  pvlib's: 0 = N, 90 = E, 180 = S, 270 = W. See `solar/coordinates.md`.
- **Tilt (Neigung)** — angle of a roof surface from horizontal, degrees.
- **Eave (Traufe)** — lower edge of a pitched roof.
- **Ridge (First)** — top horizontal edge where two roof surfaces meet.
- **Self-consumption (Eigenverbrauch)** — share of PV production used on
  site rather than fed to the grid.
- **Autarky (Autarkie)** — share of demand covered by own PV + storage.
- **Module / panel** — one PV panel (~1.7 m × 1 m in MVP).

## Roof shapes (templates)

- **Satteldach** — gable roof (two pitches meeting at a ridge).
- **Pultdach** — mono-pitch / shed roof (single slope).
- **Walmdach** — hip roof (all sides slope to eaves).
- **Flachdach** — flat roof (panels on tilt frames).
- **Reihenhaus-Sattel** — terraced-house gable (narrow, shared party walls).

## Economics

- **CapEx** — upfront system cost.
- **Amortization / payback** — time for cumulative savings to equal CapEx.
- **Cashflow** — yearly net €, charted over ~25 years.
- **Förderung** — subsidy/grant (static assumption in MVP).

## Data sources

- **PVGIS** — EU yield/irradiation dataset (primary).
- **Photon** — OSM-based geocoder.
- **Overpass** — OSM query API for building footprints.
- **BDEW H0** — household standard load profile.

## Persistence

- **Anon-first** — usable without login; IndexedDB tier 1.
- **Footprint** — building outline polygon (from OSM).
- **Share-link** — read-only tokenized project URL.
