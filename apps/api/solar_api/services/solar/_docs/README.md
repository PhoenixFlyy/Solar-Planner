# Service: solar

## Purpose

The generic solar-physics core: sun position over time, per-surface PV yield
(via PVGIS + pvlib), and panel-layout math. Consumed by the 3D editor (sun
slider, heatmap) and the economics service. Kept free of product-specific
vocabulary so it stays reusable (AGENTS.md).

## Public surface (planned, Sprint 1)

- `sun_position(lat, lng, when) -> SunPosition`
- `surface_yield(surface) -> YieldResult`  (PVGIS-backed)
- `auto_layout(surface, density) -> PanelLayout`
