# Contributing Guidelines

## Module Documentation

Every module should have a `_docs/` folder adhering to the schema in
`architecture/templates/module-docs/`.

Most important is `OWNERS` (for this solo project: the maintainer).
The convention scales if collaborators join.

`README.md` states the module's *purpose*: why it exists from the
perspective of consumer modules and user groups.

`_docs/` may also contain:

- `architecture.md` — internal structure
- `decisions.md` — module-local decisions
- `glossary.md` — module-local vocabulary

## Test Best Practices

Pattern: `Unit_Scenario_ExpectedResult`

```python
def test_pvgis_adapter_with_invalid_lat_raises_validation_error(): ...
def test_panel_layout_with_dormer_excludes_dormer_area(): ...
def test_economics_with_zero_subsidy_returns_higher_payback(): ...
```

```typescript
it('roofSurface_whenAzimuthExceeds360_normalizesValue', () => { ... });
it('roofTemplate_satteldach_buildsCorrectGeometry', () => { ... });
```

### Referencing Purposes

```python
def test_pvgis_with_valid_coordinates_returns_monthly_yield():
    """P1: deliver realistic yield estimates from PVGIS."""
    ...
```

### Test as Specification

- Test behaviors and outcomes, not implementation details.
- Add a regression test for every bug fix.
- Don't test private functions directly.

## ADR Convention

1. Copy `architecture/adrs/ADR-TEMPLATE.md` to `00NN-short-slug.md`.
2. Status: `Proposed` → `Accepted` → `Superseded by NNNN`.
3. Sections: Context, Decision, Consequences, Alternatives.

## Wiki Convention

Wiki pages are durable facts. Good examples:

- `wiki/data-sources/pvgis.md` — what PVGIS provides, pitfalls.
- `wiki/domain/roof-templates.md` — template definitions.

Bad wiki pages: anything that duplicates code, stale within a sprint,
or should be a code comment.
