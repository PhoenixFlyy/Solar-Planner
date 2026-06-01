# Service: shading

## Purpose

Estimate self-shading on roof surfaces from the house's own geometry
(ridges, dormers, chimneys), feeding the yield calc and the 3D heatmap.
Neighbour-building shading is out of MVP scope.

## Public surface (planned, Sprint 1)

- `self_shading(geometry, sun_path) -> ShadingResult`
