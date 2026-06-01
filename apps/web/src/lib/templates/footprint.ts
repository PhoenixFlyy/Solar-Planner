// Derive building dimensions + orientation from an OSM footprint, and apply
// them to a template's parameters. The footprint constrains the template's
// ground polygon (ADR-0007) — it refines defaults, never blocks.
import { norm360 } from "./math";
import type { RoofParams } from "./types";

export interface FootprintLatLng {
  lat: number;
  lng: number;
}

export interface BuildingDimensions {
  /** Extent along the longer (ridge) axis, meters. */
  lengthM: number;
  /** Extent across the ridge, meters. */
  spanM: number;
  /** Facing of the primary slope (perpendicular to ridge), pvlib frame. */
  azimuthDeg: number;
}

const M_PER_DEG_LAT = 111_320;

/** Project lat/lng to local meters (x = east, z = north) around a reference. */
function toMeters(points: FootprintLatLng[]): { x: number; z: number }[] {
  const latRef = points.reduce((a, p) => a + p.lat, 0) / points.length;
  const lngRef = points.reduce((a, p) => a + p.lng, 0) / points.length;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((latRef * Math.PI) / 180);
  return points.map((p) => ({
    x: (p.lng - lngRef) * mPerDegLng,
    z: (p.lat - latRef) * M_PER_DEG_LAT,
  }));
}

/**
 * Minimum-area oriented bounding box over the polygon's edge directions
 * (rotating-calipers lite). Returns building dimensions and the primary
 * slope azimuth (perpendicular to the long axis, biased toward south).
 */
export function footprintDimensions(points: FootprintLatLng[]): BuildingDimensions | null {
  if (points.length < 3) return null;
  const pts = toMeters(points);

  // Standard math angle (from +x/east, toward +z/north). w = extent along the
  // edge, h = extent perpendicular.
  let best: { area: number; w: number; h: number; theta: number } | null = null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const theta = Math.atan2(b.z - a.z, b.x - a.x);
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const p of pts) {
      const u = p.x * c + p.z * s; // along the edge
      const v = -p.x * s + p.z * c; // perpendicular
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    const w = maxU - minU;
    const h = maxV - minV;
    const area = w * h;
    if (!best || area < best.area) best = { area, w, h, theta };
  }
  if (!best || best.area === 0) return null;

  const lengthM = Math.max(best.w, best.h);
  const spanM = Math.min(best.w, best.h);

  // Long-axis direction (the ridge), as a standard math angle, then as a
  // compass azimuth (x=east, z=north -> azimuth = atan2(dx, dz)).
  const longTheta = best.w >= best.h ? best.theta : best.theta + Math.PI / 2;
  const ridgeAzimuth = norm360(
    (Math.atan2(Math.cos(longTheta), Math.sin(longTheta)) * 180) / Math.PI,
  );

  // Primary slope faces perpendicular to the ridge; bias toward south (180).
  const optionA = norm360(ridgeAzimuth + 90);
  const optionB = norm360(ridgeAzimuth - 90);
  const azimuthDeg = southBias(optionA) <= southBias(optionB) ? optionA : optionB;

  return {
    lengthM: round(lengthM),
    spanM: round(spanM),
    azimuthDeg: Math.round(azimuthDeg / 5) * 5,
  };
}

const southBias = (a: number): number => Math.abs(((a - 180 + 540) % 360) - 180);
const round = (m: number): number => Math.round(m * 2) / 2; // snap to 0.5 m grid

/** Apply derived dimensions to whatever dimension keys a param set exposes. */
export function applyDimensions(params: RoofParams, dims: BuildingDimensions): RoofParams {
  const next: RoofParams = { ...params };
  if ("lengthM" in next) next.lengthM = dims.lengthM;
  if ("spanM" in next) next.spanM = dims.spanM;
  else if ("widthM" in next) next.widthM = dims.spanM;
  if ("azimuthDeg" in next) next.azimuthDeg = dims.azimuthDeg;
  return next;
}
