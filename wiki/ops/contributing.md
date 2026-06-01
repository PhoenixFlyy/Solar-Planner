# Contributing Workflow

The durable conventions live in the root [CONTRIBUTING.md](../../CONTRIBUTING.md)
and [AGENTS.md](../../AGENTS.md). This page is the operational checklist.

## Before you start

- Read [AGENTS.md](../../AGENTS.md) (constraints) and the relevant ADRs.
- Check for existing precedent: adapters, R3F components, roof templates.

## While you work

- Keep MoSCoW order: Must → Should → Nice-to-have. Don't pull nice-to-have
  forward without a confirmed reason.
- Routers thin; business logic in `services/`; external APIs in `adapters/`.
- Forms only for non-spatial data; spatial decisions go in the 3D editor.
- Add tests for non-trivial changes; pattern `Unit_Scenario_ExpectedResult`.

## Before you commit

- `pnpm test` (touched areas at minimum).
- `pnpm run codegen` if you changed API schemas (CI checks the diff).
- Update [DEPLOYMENT.md](../../DEPLOYMENT.md) if deployment surface changed.
- Commit per the cadence in [AGENTS.md](../../AGENTS.md): one coherent
  segment per commit.

## Decisions

- Repo-wide decision → new ADR (copy `architecture/adrs/ADR-TEMPLATE.md`).
- Module-local decision → that module's `_docs/decisions.md`.
- Never silently change an accepted ADR; supersede it.
