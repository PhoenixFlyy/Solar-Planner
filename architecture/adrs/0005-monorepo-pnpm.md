# ADR-0005: Monorepo with pnpm workspaces

## Status

Accepted — 2026-06-01

## Context

Web (TS) and API (Python) plus a generated shared-types package must evolve
together; the type-safety boundary (FastAPI OpenAPI → generated TS) only
works if web and the generated package live and version together. A single
repo with one dev workflow (`setup`, `dev`, `codegen`, `test`) is simplest
for a solo maintainer.

## Decision

Use a **pnpm workspace monorepo**. `pnpm-workspace.yaml` includes
`apps/*` and `packages/*`. The Python API lives under `apps/api/` and is
managed by `uv` (not part of the pnpm graph, but driven by the same root
scripts). Project scripts are invoked as `pnpm run <script>`.

Note: `pnpm setup` is a reserved pnpm command (it configures pnpm itself),
so the bootstrap script is invoked as `pnpm run setup`, never `pnpm setup`.

## Consequences

- Positive: One install, one lockfile for JS; shared-types versioned with
  its consumer; consistent root scripts; cheap cross-package refactors.
- Negative: pnpm vs npm gotchas (reserved `setup`, strict peer deps);
  contributors must use pnpm, not npm.
- Neutral: Python deps stay outside the pnpm graph, orchestrated by uv.

## Alternatives considered

- npm workspaces: rejected — slower installs, looser node_modules layout,
  no benefit over pnpm here. (The original plan README used `npm`; this ADR
  is the canonical ruling and that doc was reconciled to pnpm.)
- Two separate repos: rejected — breaks the single codegen boundary and
  doubles the dev/CI setup.
- Nx/Turborepo: deferred — unnecessary tooling weight for two apps.
