# Claude Code Guidance for Solar Planner

This is the long-form guidance for Claude Code agents. The short
summary lives in [AGENTS.md](./AGENTS.md). The vision lives in
[PROJECT.md](./PROJECT.md).

## Repository philosophy

- **Solo maintainer, AI-assisted.** Optimize for clarity, replaceability,
  documentation.
- **Local-first.** Everything must work offline with `pnpm run dev`.
- **Free during development.** Lean on free tiers; features degrade
  gracefully if those services aren't configured.
- **Modular.** External APIs, physics calcs, 3D primitives each live in
  their own module.
- **Visual first.** When in doubt between showing a number and showing
  a visual, choose visual. Add the number next to it.

## Working style

- **Read before you write.** Check whether the capability already
  exists.
- **Ask for ambiguity, not for permission.** Don't ask "should I add a
  test?" — yes. Do ask "the schema for `RoofSurface` is ambiguous,
  should `azimuth_deg` be 0=north or 0=south?".
- **Small commits, often.**
- **Document the decision, not the code.** Comments explain *why*.

## Code conventions

### TypeScript / Next.js

- Strict mode on. No `any`, no `@ts-ignore` without explanation.
- Server components by default. `"use client"` only when needed.
- Forms: React Hook Form + Zod. Zod schemas mirror Pydantic models.
- API calls: TanStack Query, never raw `fetch` in components.
- IndexedDB: Dexie only. Never `localStorage` for project data.
- Client state: Zustand. One store per editor concern.
- 3D: React Three Fiber. Custom shaders only with approval.
- Charts: Recharts. Custom D3 only when Recharts can't express it.

### Python / FastAPI

- Type hints everywhere. `mypy --strict` in CI.
- Pydantic v2 syntax.
- SQLModel for ORM. Raw SQL only for PostGIS operations.
- Routers thin. Business logic in `services/`. External APIs in
  `adapters/`.
- Adapters always:
  - return Pydantic models, not raw dicts;
  - use `httpx.AsyncClient` with `hishel` cache;
  - have per-instance `cache_ttl_seconds` and
    `rate_limit_per_minute`;
  - have a Tenacity retry decorator;
  - translate `HTTPStatusError` to a domain exception.

### 3D conventions

- Coordinate system: Y up, Z north. Document in
  `wiki/solar/coordinates.md`.
- Units: meters everywhere.
- Scale: 1 unit = 1 meter. Houses ~10m, panels ~1.7m × 1m.
- Light: one `<directionalLight>` (sun), one `<ambientLight>` (fill).
  No HDRI in MVP.
- Shadows: `PCFSoftShadowMap`, 2048 resolution max.
- Performance: instanced meshes for panels. LOD only for distant
  buildings (Phase 3).
- **Gamified UX in 3D:** every interaction has immediate visual
  feedback. Snap-to-grid by default. Hover states. No silent state
  changes.

### Roof templates

- Live in `apps/web/src/lib/templates/`.
- Each template exports a `RoofTemplate` with: `id`, `name`,
  `previewImage`, `parameters` (sensible defaults),
  `buildGeometry(params)`.
- MVP templates: Satteldach, Pultdach, Walmdach, Flachdach,
  Reihenhaus-Sattel.
- See ADR-0007.

### Solar physics conventions

- Cite formula sources with wiki links in comments.
- pvlib is authoritative. Custom math only when pvlib doesn't cover
  the case; document why in the wiki.
- Validate every new calc against PVGIS for at least 3 reference
  locations.

## Ask before

1. Adding a paid external API.
2. Adding a paid hosted service.
3. Introducing a new core dependency (3D engine, state library, ORM,
   queue, auth).
4. Adding a database migration that drops a column or table.
5. Adding personally identifiable data fields.
6. Changing the locked tech stack from `INITIAL_PROMPT.md` Part 4.
7. Adding a feature outside the current sprint scope.
8. Pulling a nice-to-have feature forward into MVP.

For everything else, proceed and ask only if you genuinely don't know
which path the maintainer prefers.

## Common pitfalls

- **Mixing `localStorage` and `IndexedDB`.** IndexedDB for project
  state, `localStorage` only for trivial UI prefs.
- **Skipping `pnpm run codegen`.** CI catches this.
- **Solar math in the wrong frame.** pvlib azimuth: 0=N, 90=E, 180=S,
  270=W.
- **Business logic in routers.** Routers parse, validate, delegate,
  serialize.
- **Logging PII.** Never log addresses, names, emails.
- **Forms instead of direct manipulation.** Spatial decisions (where
  on the roof?) belong in the 3D editor. Forms are for non-spatial
  data.

## Tooling

- Linting: `ruff` (Python), `eslint` + `prettier` (TS).
- Type-check: `mypy --strict`, `tsc --noEmit`.
- Tests: `pytest`, `vitest`, `playwright`.
- CI: GitHub Actions, parallel api/web jobs, codegen-sync check.
