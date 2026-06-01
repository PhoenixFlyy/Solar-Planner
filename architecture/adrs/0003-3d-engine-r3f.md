# ADR-0003: 3D engine — React Three Fiber

## Status

Accepted — 2026-06-01

## Context

The MVP requires an interactive, gamified 3D house editor: roof templates,
draggable obstacles, a sun that moves on a time slider with live shadows,
and a per-module yield heatmap. The team is solo and React-based. We want
declarative 3D that composes with React state, not an imperative engine
maintained in parallel with the UI.

## Decision

Use **React Three Fiber** (R3F) over Three.js, with `@react-three/drei` for
common helpers (orbit controls, gizmos, instancing, environment). Custom
shaders only with maintainer approval. Conventions (Y up, Z north, meters,
one directional + one ambient light, `PCFSoftShadowMap` @ 2048, instanced
meshes for panels) are recorded in `CLAUDE.md` and
`wiki/solar/coordinates.md`.

## Consequences

- Positive: 3D scene is declarative React; state from Zustand drives the
  scene directly; drei removes boilerplate; huge ecosystem.
- Negative: R3F reconciler overhead vs. hand-tuned Three.js; need discipline
  on instancing to keep panel counts performant.
- Neutral: Photorealism is a non-goal for MVP (schematic look). HDRI, LOD,
  and 3D-tiles are deferred to Phase 3.

## Alternatives considered

- Raw Three.js: rejected — imperative scene graph duplicated alongside React
  state; more glue code for a solo maintainer.
- Babylon.js: rejected — capable but less idiomatic in a React codebase,
  smaller React-integration ecosystem.
- Cesium / Google 3D Tiles: deferred to Phase 3 (geospatial photoreal is
  out of MVP scope and not free at scale).
