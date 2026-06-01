# Roof Templates

Template-first is a core design decision (see
[ADR-0007](../../architecture/adrs/0007-roof-template-first.md)). The user
picks a roof shape and tunes parameters; nobody types "azimuth" before they
see a roof.

## MVP templates

| id | German | English | Defining parameters |
|---|---|---|---|
| `satteldach` | Satteldach | Gable roof | ridge height, eave height, tilt, ridge orientation, width, length |
| `pultdach` | Pultdach | Mono-pitch / shed | high eave, low eave, tilt, orientation, width, length |
| `walmdach` | Walmdach | Hip roof | ridge height, eave height, tilt, hip inset, width, length |
| `flachdach` | Flachdach | Flat roof | parapet height, width, length (panels on tilt frames) |
| `reihenhaus-sattel` | Reihenhaus-Sattel | Terraced gable | as Satteldach, narrow width, shared party walls (no gable-end yield) |

## Contract

Each template lives in `apps/web/src/lib/templates/` and exports a
`RoofTemplate`:

```ts
interface RoofTemplate {
  id: string;
  name: string;            // localized via next-intl key
  previewImage: string;    // /public path to the picker thumbnail
  parameters: RoofParams;  // sensible defaults
  buildGeometry(params: RoofParams): RoofGeometry; // → R3F meshes + per-surface planes
}
```

`buildGeometry` produces, per roof surface, an editable plane carrying:
tilt, azimuth, usable area (obstacles subtracted), and the module layout
target. Yield is computed per surface (PVGIS) and aggregated.

## Footprint integration

When an OSM footprint exists, it **constrains** the template's ground polygon
(width/length/orientation seeded from the footprint). Without it, the user
sets free dimensions. The footprint never blocks — it only refines.

## Units & frame

Meters everywhere; 1 unit = 1 m. Scene frame Y up, Z north (see
[../solar/coordinates.md](../solar/coordinates.md)). Houses ~10 m, panels
~1.7 m × 1 m.

## Testing

Geometry tests assert expected volumes/areas per template against known
parameter sets (Sprint 1, M1.0), e.g.
`roofTemplate_satteldach_buildsCorrectGeometry`.
