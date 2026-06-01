# Solar Planner

Agent-focused operational guide. For the project vision see
[PROJECT.md](./PROJECT.md). For agent constraints see [AGENTS.md](./AGENTS.md).

## Repository Map

| Folder | Description |
|---|---|
| `apps/web/` | Next.js 15 frontend (port 3000 in dev) |
| `apps/api/` | FastAPI backend (port 8000 in dev) |
| `packages/shared-types/` | Auto-generated TS types from OpenAPI |
| `infra/` | Docker Compose for local infrastructure |
| `architecture/` | ADRs, templates, diagrams |
| `wiki/` | Internal knowledge base — start with `wiki/index.md` |
| `scripts/` | Dev workflow, codegen, setup |
| `.agents/skills/` | Canonical repo-local skills |
| `.claude/commands/` | Claude Code slash-command wrappers |

## Current Phase

- AI-assisted rapid prototyping mode.
- Local-first; validation target is local Docker.
- Online preview uses free tiers (Vercel + Fly.io + Supabase).
- Prefer simple, replaceable architecture over enterprise hardening.
- Unit tests expected for non-trivial changes; keep them simple.
- Architecture decisions are recorded in `architecture/adrs/`.

## Prerequisites

- Node.js `22+`
- pnpm `10+`
- Python `3.12`
- uv (Python toolchain / venv manager)
- Docker Desktop
- Supabase project (Free) only for online-preview deploys

> **Package manager:** this is a pnpm workspace monorepo (see
> [ADR-0005](./architecture/adrs/0005-monorepo-pnpm.md)). Use `pnpm`,
> not `npm`. Invoke project scripts as `pnpm run <script>` (`pnpm setup`
> is a reserved pnpm command, so the bootstrap script is `pnpm run
> setup`).

## Setup

```bash
pnpm run setup
```

Idempotent. Installs every workspace, sets up Python venv via `uv`,
copies `.env.example` to `.env.local` if missing, runs `codegen`.

## Dev scripts

| Command | What it starts |
|---|---|
| `pnpm run dev` | web + api together, opens browser when ready |
| `pnpm run dev:web` | Next.js only |
| `pnpm run dev:api` | FastAPI only |
| `pnpm run dev:infra` | Docker Compose: postgres, redis, minio |

## Port Map

| Service | Port |
|---|---|
| Web | `3000` |
| API | `8000` |
| Postgres | `5432` |
| Redis | `6379` |
| MinIO API | `9000` |
| MinIO Console | `9001` |

## Tests

- All: `pnpm test`
- Frontend: `pnpm run test:web`
- Backend: `pnpm run test:api`
- E2E: `pnpm run test:e2e`

## Code Generation

```bash
pnpm run codegen
```

Regenerates `packages/shared-types/` from FastAPI OpenAPI schema. CI
fails if out of sync.

## Coding-Agent Pointers

- Read [AGENTS.md](./AGENTS.md) first.
- For Claude Code-specific guidance, read [CLAUDE.md](./CLAUDE.md).
- For module conventions and tests, see [CONTRIBUTING.md](./CONTRIBUTING.md).
- For architecture changes, start with `architecture/adrs/`.
- For domain knowledge, start with `wiki/index.md`.

## See Also

- [PROJECT.md](./PROJECT.md) — long-term vision and feature priorities
- [architecture/adrs/](./architecture/adrs/) — decision log
- [wiki/index.md](./wiki/index.md) — internal knowledge base
