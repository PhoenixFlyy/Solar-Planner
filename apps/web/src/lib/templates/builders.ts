// Pure geometry builders: params -> RoofGeometry. Built in a local frame with
// the primary slope facing south (azimuth 180), then rotated to the requested
// azimuth. See wiki/solar/coordinates.md for the frame and azimuth convention.
import { norm360, rotateY, slant, tiltDeg } from "./math";
import type {
  FlatParams,
  GableParams,
  HipParams,
  MonoParams,
  RoofGeometry,
  RoofSurface,
  RoofTemplateId,
  Vec3,
} from "./types";

type LocalSurface = Omit<RoofSurface, "azimuthDeg"> & { localAzimuthDeg: number };

/** Rotate polygons + shift azimuths so the front faces `azimuthDeg`. */
function orient(
  local: LocalSurface[],
  ground: Vec3[],
  gableFaces: Vec3[][],
  frontAzimuthDeg: number,
): Pick<RoofGeometry, "surfaces" | "groundPolygon" | "gableFaces"> {
  const delta = frontAzimuthDeg - 180; // local front faces south (180)
  const surfaces = local.map(({ localAzimuthDeg, polygon, ...rest }) => ({
    ...rest,
    azimuthDeg: norm360(localAzimuthDeg + delta),
    polygon: polygon.map((p) => rotateY(p, delta)),
  }));
  return {
    surfaces,
    groundPolygon: ground.map((p) => rotateY(p, delta)),
    gableFaces: gableFaces.map((face) => face.map((p) => rotateY(p, delta))),
  };
}

function rect(hw: number, hd: number): Vec3[] {
  return [
    [-hw, 0, -hd],
    [hw, 0, -hd],
    [hw, 0, hd],
    [-hw, 0, hd],
  ];
}

export function buildGable(p: GableParams, templateId: RoofTemplateId): RoofGeometry {
  const run = p.spanM / 2;
  const rise = p.ridgeHeightM - p.eaveHeightM;
  const t = tiltDeg(run, rise);
  const area = slant(run, rise) * p.lengthM;
  const hw = p.lengthM / 2; // ridge runs E-W along X
  const hs = p.spanM / 2;

  const local: LocalSurface[] = [
    {
      id: "front",
      nameKey: "front",
      localAzimuthDeg: 180,
      tiltDeg: t,
      areaM2: area,
      polygon: [
        [-hw, p.eaveHeightM, -hs],
        [hw, p.eaveHeightM, -hs],
        [hw, p.ridgeHeightM, 0],
        [-hw, p.ridgeHeightM, 0],
      ],
    },
    {
      id: "back",
      nameKey: "back",
      localAzimuthDeg: 0,
      tiltDeg: t,
      areaM2: area,
      polygon: [
        [-hw, p.eaveHeightM, hs],
        [-hw, p.ridgeHeightM, 0],
        [hw, p.ridgeHeightM, 0],
        [hw, p.eaveHeightM, hs],
      ],
    },
  ];

  // Gable-end triangles at x = ±hw, between eave and ridge.
  const gableFaces: Vec3[][] = [
    [
      [hw, p.eaveHeightM, -hs],
      [hw, p.eaveHeightM, hs],
      [hw, p.ridgeHeightM, 0],
    ],
    [
      [-hw, p.eaveHeightM, -hs],
      [-hw, p.eaveHeightM, hs],
      [-hw, p.ridgeHeightM, 0],
    ],
  ];

  return {
    templateId,
    footprintWidthM: p.lengthM,
    footprintDepthM: p.spanM,
    eaveHeightM: p.eaveHeightM,
    ridgeHeightM: p.ridgeHeightM,
    ...orient(local, rect(hw, hs), gableFaces, p.azimuthDeg),
  };
}

export function buildMono(p: MonoParams, templateId: RoofTemplateId = "pultdach"): RoofGeometry {
  const run = p.widthM;
  const rise = p.highEaveHeightM - p.lowEaveHeightM;
  const t = tiltDeg(run, rise);
  const area = slant(run, rise) * p.lengthM;
  const hw = p.lengthM / 2; // E-W along X
  const hd = p.widthM / 2; // N-S along Z (low eave south, high eave north)
  const lo = p.lowEaveHeightM;
  const hi = p.highEaveHeightM;

  const local: LocalSurface[] = [
    {
      id: "slope",
      nameKey: "slope",
      localAzimuthDeg: 180, // downhill toward south
      tiltDeg: t,
      areaM2: area,
      polygon: [
        [-hw, lo, -hd],
        [hw, lo, -hd],
        [hw, hi, hd],
        [-hw, hi, hd],
      ],
    },
  ];

  // East/west side triangles (low->high) + the north high-side rectangle.
  const gableFaces: Vec3[][] = [
    [
      [hw, lo, -hd],
      [hw, lo, hd],
      [hw, hi, hd],
    ],
    [
      [-hw, lo, -hd],
      [-hw, lo, hd],
      [-hw, hi, hd],
    ],
    [
      [-hw, lo, hd],
      [hw, lo, hd],
      [hw, hi, hd],
      [-hw, hi, hd],
    ],
  ];

  return {
    templateId,
    footprintWidthM: p.lengthM,
    footprintDepthM: p.widthM,
    eaveHeightM: lo,
    ridgeHeightM: hi,
    ...orient(local, rect(hw, hd), gableFaces, p.azimuthDeg),
  };
}

export function buildHip(p: HipParams, templateId: RoofTemplateId = "walmdach"): RoofGeometry {
  const run = p.spanM / 2;
  const rise = p.ridgeHeightM - p.eaveHeightM;
  const hipInset = Math.max(0, Math.min(p.hipInsetM, p.lengthM / 2));
  const ridgeLen = Math.max(0, p.lengthM - 2 * hipInset);

  const tLong = tiltDeg(run, rise);
  const slantLong = slant(run, rise);
  const longArea = ((p.lengthM + ridgeLen) / 2) * slantLong; // trapezoid

  const tEnd = tiltDeg(hipInset, rise);
  const slantEnd = slant(hipInset, rise);
  const endArea = 0.5 * p.spanM * slantEnd; // triangle

  const hw = p.lengthM / 2;
  const hs = p.spanM / 2;
  const rhw = ridgeLen / 2;

  const local: LocalSurface[] = [
    {
      id: "front",
      nameKey: "front",
      localAzimuthDeg: 180,
      tiltDeg: tLong,
      areaM2: longArea,
      polygon: [
        [-hw, p.eaveHeightM, -hs],
        [hw, p.eaveHeightM, -hs],
        [rhw, p.ridgeHeightM, 0],
        [-rhw, p.ridgeHeightM, 0],
      ],
    },
    {
      id: "back",
      nameKey: "back",
      localAzimuthDeg: 0,
      tiltDeg: tLong,
      areaM2: longArea,
      polygon: [
        [-hw, p.eaveHeightM, hs],
        [-rhw, p.ridgeHeightM, 0],
        [rhw, p.ridgeHeightM, 0],
        [hw, p.eaveHeightM, hs],
      ],
    },
    {
      id: "hipEast",
      nameKey: "hipEast",
      localAzimuthDeg: 90, // +X
      tiltDeg: tEnd,
      areaM2: endArea,
      polygon: [
        [hw, p.eaveHeightM, -hs],
        [hw, p.eaveHeightM, hs],
        [rhw, p.ridgeHeightM, 0],
      ],
    },
    {
      id: "hipWest",
      nameKey: "hipWest",
      localAzimuthDeg: 270, // -X
      tiltDeg: tEnd,
      areaM2: endArea,
      polygon: [
        [-hw, p.eaveHeightM, hs],
        [-hw, p.eaveHeightM, -hs],
        [-rhw, p.ridgeHeightM, 0],
      ],
    },
  ];

  // Hip roofs reach the eave on all sides — the eave-height box fully closes it.
  return {
    templateId,
    footprintWidthM: p.lengthM,
    footprintDepthM: p.spanM,
    eaveHeightM: p.eaveHeightM,
    ridgeHeightM: p.ridgeHeightM,
    ...orient(local, rect(hw, hs), [], p.azimuthDeg),
  };
}

export function buildFlat(p: FlatParams, templateId: RoofTemplateId = "flachdach"): RoofGeometry {
  const hw = p.widthM / 2;
  const hd = p.lengthM / 2;
  const y = p.roofHeightM;

  const surfaces: RoofSurface[] = [
    {
      id: "deck",
      nameKey: "deck",
      azimuthDeg: 0, // flat: panels go on tilt frames later (M1.3)
      tiltDeg: 0,
      areaM2: p.widthM * p.lengthM,
      polygon: [
        [-hw, y, -hd],
        [hw, y, -hd],
        [hw, y, hd],
        [-hw, y, hd],
      ],
    },
  ];

  return {
    templateId,
    footprintWidthM: p.widthM,
    footprintDepthM: p.lengthM,
    eaveHeightM: p.roofHeightM,
    ridgeHeightM: p.roofHeightM + p.parapetHeightM,
    surfaces,
    groundPolygon: rect(hw, hd),
    gableFaces: [],
  };
}
