# Service: geo

## Purpose

Turn a user's address into a location and (when available) a building
footprint, so the planner can place a house on the map. Consumed by the
location step of the wizard and the walking skeleton. Wraps the Photon
(geocode) and Overpass (footprint) adapters and returns typed domain models.

## Public surface

- `geocode(query) -> list[GeocodeResult]`
- `footprint(lat, lng) -> Footprint | None`
