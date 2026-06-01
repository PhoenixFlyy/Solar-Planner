# Google Solar API — DEFERRED (paid)

> **Status: not used in MVP.** The maintainer flagged this as a reference
> only. Any activation requires a superseding ADR (provisionally ADR-0008)
> with a cost estimate and maintainer confirmation. Never enable a paid API
> without that (see [AGENTS.md](../../AGENTS.md) hard rules).

## What it would provide

- Building Insights: roof segments, areas, tilt/azimuth per segment, and
  modelled solar potential from aerial imagery + DSM.
- Data Layers: flux maps, DSM, monthly/annual irradiance rasters.

## Why deferred

- **Paid**, with per-request pricing — conflicts with the free-during-dev
  strategy (see [ADR-0006](../../architecture/adrs/0006-free-tier-dev-strategy.md)).
- MVP is template-first (see
  [ADR-0007](../../architecture/adrs/0007-roof-template-first.md)); we do not
  need imagery-derived geometry to ship the core value.

## Where it could fit later (Phase 3)

- Auto-suggest roof geometry to pre-fill a template.
- Cross-check installable module count against modelled potential.

When evaluated: capture coverage for Germany, pricing tiers, free quota (if
any), and latency in ADR-0008 before any code is written.
