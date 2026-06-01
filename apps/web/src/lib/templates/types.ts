// Roof template model (ADR-0007, wiki/domain/roof-templates.md).
// Coordinate frame: Y up, Z north, X east, meters (wiki/solar/coordinates.md).
// Azimuth uses the pvlib frame: 0=N, 90=E, 180=S, 270=W.

export type Vec3 = [number, number, number];

/** One planar roof face — the unit of module layout and yield. */
export interface RoofSurface {
  id: string;
  /** Localized display name key suffix (e.g. "south", "hipEast"). */
  nameKey: string;
  /** Outward-facing compass orientation, pvlib frame (0=N…180=S…). */
  azimuthDeg: number;
  /** Pitch from horizontal: 0 = flat, 90 = vertical. */
  tiltDeg: number;
  /** Usable area of the face in m² (before obstacle subtraction). */
  areaM2: number;
  /** World-space corner ring of the face (Y up, Z north), meters. */
  polygon: Vec3[];
}

/** The full buildable geometry produced from a template's parameters. */
export interface RoofGeometry {
  templateId: string;
  /** Building extent east-west (X), meters. */
  footprintWidthM: number;
  /** Building extent north-south (Z), meters. */
  footprintDepthM: number;
  eaveHeightM: number;
  /** Highest roof point; equals eaveHeightM for a flat roof. */
  ridgeHeightM: number;
  surfaces: RoofSurface[];
  /** Building footprint ring at ground level (y = 0). */
  groundPolygon: Vec3[];
}

// --- Per-template parameter sets ----------------------------------------

export interface GableParams {
  /** Span across the ridge (eave-to-eave), meters. */
  spanM: number;
  /** Length along the ridge, meters. */
  lengthM: number;
  eaveHeightM: number;
  ridgeHeightM: number;
  /** Facing of the primary (front) slope, pvlib frame. Default 180 (south). */
  azimuthDeg: number;
}

export interface MonoParams {
  /** Horizontal run of the single slope (low eave to high eave), meters. */
  widthM: number;
  lengthM: number;
  lowEaveHeightM: number;
  highEaveHeightM: number;
  /** Downhill facing of the slope, pvlib frame. */
  azimuthDeg: number;
}

export interface HipParams {
  spanM: number;
  lengthM: number;
  eaveHeightM: number;
  ridgeHeightM: number;
  /** Distance the ridge is inset from each gable end (the hip run), meters. */
  hipInsetM: number;
  azimuthDeg: number;
}

export interface FlatParams {
  widthM: number;
  lengthM: number;
  roofHeightM: number;
  parapetHeightM: number;
}

export type RoofParams = GableParams | MonoParams | HipParams | FlatParams;

// --- Template definition -------------------------------------------------

export type RoofTemplateId =
  | "satteldach"
  | "pultdach"
  | "walmdach"
  | "flachdach"
  | "reihenhaus-sattel";

export interface RoofTemplate<P extends RoofParams = RoofParams> {
  id: RoofTemplateId;
  /** next-intl key under the "RoofTemplates" namespace. */
  nameKey: string;
  /** Path under /public for the picker thumbnail. */
  previewImage: string;
  /** Sensible starting parameters. */
  defaults: P;
  buildGeometry(params: P): RoofGeometry;
}
