# Coordinate Frames

Two distinct frames live in this project. Mixing them is the classic solar
bug — keep them straight.

## 1. 3D scene frame (React Three Fiber)

- **Y up**, **Z north**, X east. Right-handed.
- Units: **meters**. 1 unit = 1 m.
- Houses ~10 m; panels ~1.7 m × 1 m.
- The sun is one `<directionalLight>`; its position is derived from the
  solar azimuth/elevation for the selected timestamp (Sprint 1, M1.2).

Mapping solar azimuth/elevation → scene direction vector (sun *position*,
the light points toward the origin from there):

```
// azimuth measured from North, clockwise (pvlib convention: 0=N, 90=E, 180=S, 270=W)
// elevation measured from the horizon
const az = degToRad(azimuthDeg);
const el = degToRad(elevationDeg);
const dir = {
  x: Math.cos(el) * Math.sin(az),  // east component
  y: Math.sin(el),                 // up
  z: -Math.cos(el) * Math.cos(az), // north is -Z toward scene? see note
};
```

> Note: Z north means "north" is +Z. The sun in the northern hemisphere is
> to the south at noon, so the noon sun sits at −Z (south) and +Y (up).
> Verify sign once empirically against a known date/time when M1.2 lands and
> lock it with a test.

## 2. Solar azimuth conventions

- **pvlib**: azimuth **0 = N, 90 = E, 180 = S, 270 = W**; this is the
  project-canonical solar frame (see [CLAUDE.md](../../CLAUDE.md)).
- **PVGIS `aspect`**: **0 = S**, −90 = E, +90 = W. The PVGIS adapter must
  convert to/from pvlib's frame at the boundary
  (see [../data-sources/pvgis.md](../data-sources/pvgis.md)).

Conversion (pvlib → PVGIS aspect): `aspect = azimuth_pvlib - 180`,
normalized to (−180, 180].

## Rule

- Store and pass azimuth internally in the **pvlib frame** (0 = N).
- Convert only at adapter boundaries (PVGIS) and when building the scene
  light vector.
- Every new calc that touches azimuth gets a test pinning the frame.
