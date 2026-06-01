# ADR-0001: Locked tech stack

## Status

Accepted — 2026-06-01

## Context

A solo, AI-assisted project needs a stack that is standard (well-documented,
LLM-friendly), free during development, web-first, and capable of both
serious solar physics (Python scientific ecosystem) and rich interactive 3D
(web). Decisions made ad hoc would drift; locking the stack up front keeps
later choices consistent and makes deviations explicit.

## Decision

Adopt the following stack. Changes require a superseding ADR and maintainer
confirmation.

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router, React 19, TS strict) |
| Styling | Tailwind 4 + shadcn/ui |
| Client state | Zustand |
| Server state | TanStack Query |
| 3D | React Three Fiber + `@react-three/drei` |
| Charts | Recharts |
| Maps 2D | MapLibre GL JS |
| i18n | next-intl |
| Local persistence | Dexie.js (IndexedDB) |
| Backend | Python 3.12 + FastAPI + Pydantic v2 |
| ORM | SQLModel |
| Migrations | Alembic |
| Background jobs | arq |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Cache | Redis 7 |
| Object storage | MinIO (local), Supabase Storage (online) |
| Auth (optional) | Supabase Auth |
| Hosting Web | Vercel Hobby |
| Hosting API | Fly.io Free |
| Online DB/Auth/Storage | Supabase Free |
| Error tracking | Sentry Developer Free |
| Analytics | Umami Cloud Free / Plausible |

## Consequences

- Positive: One source of truth for technology choices; consistent codegen
  boundary (FastAPI OpenAPI → TS types); free local + preview.
- Negative: Two languages (TS + Python) to maintain; Fly.io 256 MB forces
  care with `geopandas` (worker-only loading).
- Neutral: Extensions (Cesium, Google Solar API, SAM 2) are explicitly out
  of MVP and will get their own ADRs.

## Alternatives considered

- All-TypeScript (e.g. yield math in JS): rejected — pvlib/geopandas have no
  mature JS equivalent.
- Django/DRF instead of FastAPI: rejected — heavier, less async-native, no
  Pydantic-v2-first schema-to-OpenAPI story.
- Celery for jobs: rejected — heavier than arq for an async-native app.
