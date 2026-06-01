# Testing

## Commands

| Scope | Command |
|---|---|
| Everything | `pnpm test` |
| Frontend (Vitest) | `pnpm run test:web` |
| Backend (pytest) | `pnpm run test:api` |
| E2E (Playwright) | `pnpm run test:e2e` |

## Conventions

- Naming: `Unit_Scenario_ExpectedResult`
  - Python: `test_pvgis_adapter_with_invalid_lat_raises_validation_error`
  - TS: `roofSurface_whenAzimuthExceeds360_normalizesValue`
- Test behaviours and outcomes, not implementation details.
- Reference the purpose in the docstring when useful (`"""P1: ..."""`).
- Add a regression test for every bug fix.
- Don't test private functions directly.

## Adapters

- Unit-test adapters with **mocked** HTTP (no live external calls in unit
  tests). Pin the azimuth/coordinate frame in assertions.
- Warm the `hishel` cache with fixtures for any test that needs PVGIS-like
  data rather than hitting the live API.

## Walking skeleton (Sprint 0.6)

- 1 backend unit test per adapter (photon, overpass), mocked.
- 1 backend integration test for the geocode router.
- 1 Playwright smoke test: address → map shows footprint, survives reload.

## CI

GitHub Actions runs lint, type-check (`mypy --strict`, `tsc --noEmit`),
unit tests, and build in parallel web/api jobs, plus a codegen-sync check.
