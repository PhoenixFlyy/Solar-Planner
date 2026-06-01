# Service: reports

## Purpose

Produce the diverse exports of a finished plan — PDF summary with charts,
XLSX detail tables, JSON for re-import, PNG of the 3D house, and the
read-only share-link payload. Consumed by the export hub (Sprint 1, M1.7).
The disclaimer is visible on every export.

## Public surface (planned, Sprint 1)

- `build_pdf(project) -> bytes`
- `build_xlsx(project) -> bytes`
- `build_project_json(project) -> dict`
