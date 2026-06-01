# Architecture

This folder is the decision log and durable architecture reference for
Solar Planner.

## Contents

- [`adrs/`](./adrs/) — Architecture Decision Records. Start here to
  understand *why* the system is shaped the way it is.
- [`templates/module-docs/`](./templates/module-docs/) — the canonical
  `_docs/` schema every module copies (see [CONTRIBUTING.md](../CONTRIBUTING.md)).

## ADR index

| ADR | Title | Status |
|---|---|---|
| [0001](./adrs/0001-tech-stack.md) | Locked tech stack | Accepted |
| [0002](./adrs/0002-anon-first-persistence.md) | Anon-first persistence | Accepted |
| [0003](./adrs/0003-3d-engine-r3f.md) | 3D engine — React Three Fiber | Accepted |
| [0004](./adrs/0004-pvgis-primary-yield-source.md) | PVGIS as primary yield source | Accepted |
| [0005](./adrs/0005-monorepo-pnpm.md) | Monorepo with pnpm workspaces | Accepted |
| [0006](./adrs/0006-free-tier-dev-strategy.md) | Free-tier development strategy | Accepted |
| [0007](./adrs/0007-roof-template-first.md) | Roof-template-first approach | Accepted |

## Writing a new ADR

1. Copy [`adrs/ADR-TEMPLATE.md`](./adrs/ADR-TEMPLATE.md) to
   `adrs/00NN-short-slug.md`.
2. Status flow: `Proposed` → `Accepted` → `Superseded by NNNN`.
3. Never silently change an accepted decision — write a superseding ADR.
