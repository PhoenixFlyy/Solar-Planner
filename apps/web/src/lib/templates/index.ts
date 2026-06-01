// Roof template registry. MVP set per ADR-0007. Each template builds its
// geometry from parameters; the cast to a specific param type is sound because
// params always originate from the same template's `defaults` (or the editor
// bound to that template).
import { buildFlat, buildGable, buildHip, buildMono } from "./builders";
import type {
  FlatParams,
  GableParams,
  HipParams,
  MonoParams,
  RoofParams,
  RoofTemplate,
  RoofTemplateId,
} from "./types";

export const satteldach: RoofTemplate = {
  id: "satteldach",
  nameKey: "satteldach",
  previewImage: "/templates/satteldach.svg",
  defaults: {
    spanM: 9,
    lengthM: 11,
    eaveHeightM: 5,
    ridgeHeightM: 8,
    azimuthDeg: 180,
  } satisfies GableParams,
  buildGeometry: (p: RoofParams) => buildGable(p as GableParams, "satteldach"),
};

export const pultdach: RoofTemplate = {
  id: "pultdach",
  nameKey: "pultdach",
  previewImage: "/templates/pultdach.svg",
  defaults: {
    widthM: 8,
    lengthM: 11,
    lowEaveHeightM: 4,
    highEaveHeightM: 7,
    azimuthDeg: 180,
  } satisfies MonoParams,
  buildGeometry: (p: RoofParams) => buildMono(p as MonoParams, "pultdach"),
};

export const walmdach: RoofTemplate = {
  id: "walmdach",
  nameKey: "walmdach",
  previewImage: "/templates/walmdach.svg",
  defaults: {
    spanM: 9,
    lengthM: 11,
    eaveHeightM: 5,
    ridgeHeightM: 8,
    hipInsetM: 2.5,
    azimuthDeg: 180,
  } satisfies HipParams,
  buildGeometry: (p: RoofParams) => buildHip(p as HipParams, "walmdach"),
};

export const flachdach: RoofTemplate = {
  id: "flachdach",
  nameKey: "flachdach",
  previewImage: "/templates/flachdach.svg",
  defaults: {
    widthM: 9,
    lengthM: 11,
    roofHeightM: 6,
    parapetHeightM: 0.4,
  } satisfies FlatParams,
  buildGeometry: (p: RoofParams) => buildFlat(p as FlatParams, "flachdach"),
};

export const reihenhausSattel: RoofTemplate = {
  id: "reihenhaus-sattel",
  nameKey: "reihenhaus-sattel",
  previewImage: "/templates/reihenhaus-sattel.svg",
  // Narrow span, shared party walls on the gable ends (Reihenhaus).
  defaults: {
    spanM: 6,
    lengthM: 9,
    eaveHeightM: 6,
    ridgeHeightM: 8.5,
    azimuthDeg: 180,
  } satisfies GableParams,
  buildGeometry: (p: RoofParams) => buildGable(p as GableParams, "reihenhaus-sattel"),
};

export const ROOF_TEMPLATES: readonly RoofTemplate[] = [
  satteldach,
  pultdach,
  walmdach,
  flachdach,
  reihenhausSattel,
];

const BY_ID: Record<RoofTemplateId, RoofTemplate> = {
  satteldach,
  pultdach,
  walmdach,
  flachdach,
  "reihenhaus-sattel": reihenhausSattel,
};

export function getTemplate(id: RoofTemplateId): RoofTemplate {
  return BY_ID[id];
}

export * from "./types";
export { buildFlat, buildGable, buildHip, buildMono } from "./builders";
export {
  applyDimensions,
  footprintDimensions,
  type BuildingDimensions,
  type FootprintLatLng,
} from "./footprint";
