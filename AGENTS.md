# Agent Guidelines

See [CLAUDE.md](./CLAUDE.md) for the full repository guidelines for
Claude Code. This file is the short, operational summary applicable to
any agent.

## Skill convention

`.agents/skills/` is the canonical source for repo-local skills shared
by Codex and Claude guidance. Update skill bodies there only.

## Setup convention

Repo-local installs belong in `pnpm run setup`.

## Default verification stack

Use `pnpm run dev:infra` + `pnpm run dev:web` + `pnpm run dev:api` for
normal testing. Use `pnpm test` before any commit that touches
non-trivial code.

## Commit cadence

Commit after every coherent completed segment or plan boundary. If the
worktree has mixed unrelated changes and a clean commit is not safe,
stop and state the blocker before continuing into the next segment.

## Feature priority discipline

The MoSCoW from `PROJECT.md` is canonical. Must-have features ship
before should-have. Should-have ships before nice-to-have. Do not pull
nice-to-have work forward without a maintainer-confirmed reason.

## Before proposing new infrastructure

Search for existing precedent. Start with:

- [architecture/adrs/](./architecture/adrs/) — full decision log
- [wiki/index.md](./wiki/index.md) — knowledge base
- Existing adapters in `apps/api/solar_api/adapters/` before adding
  a new external API integration
- Existing R3F components in `apps/web/src/components/three/` before
  building a new 3D primitive
- Existing roof templates in `apps/web/src/lib/templates/` before
  building a new house geometry

## Intent-check protocol

For every non-trivial request:

- **Green** — request matches established boundary / precedent.
  Proceed without interruption.
- **Amber** — request likely reflects a mental-model mismatch (asks
  for custom drag-drop where R3F helpers exist, asks to re-implement
  a yield calc that lives in the `solar/` service, asks to build a
  house from scratch where a template exists). Pause once, explain
  the existing concept in 1–3 lines, ask whether the user wants the
  paved road or an intentional deviation.
- **Red** — request would hardcode product-specific vocabulary into
  the generic `solar/` service, duplicate an existing surface, break
  a declared boundary, or contradict the locked stack from
  `INITIAL_PROMPT.md` Part 4. Ask before proceeding.

If the user confirms an intentional deviation, proceed without repeated
pushback. Record the deviation in the ADR or PR notes.

Keep the interruption lean. One short correction pass only.

## Hard rules

- Never store API keys in code. Always via `.env.local` (gitignored).
- Never commit anything from `.env.local`.
- Never add a paid external API without confirmation from the
  maintainer.
- Never silently change ADR-recorded decisions. Write a new ADR that
  supersedes the old one.
- Never bypass the type-safety boundary: backend schema → OpenAPI →
  generated TS types.

## Deployment Contract

When making changes that affect deployment (env vars, ports, services,
container images, auth), update [DEPLOYMENT.md](./DEPLOYMENT.md) before
committing.
