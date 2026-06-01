// Auto-layout of PV panels on roof surfaces — the headline must-have
// "how many modules fit". Pure + framework-agnostic so it is unit-testable;
// the 3D layer renders the placements as an instanced mesh.
import type { RoofGeometry, RoofSurface, Vec3 } from "@/lib/templates";

/** A standard residential module (~1.7 m × 1.0 m), landscape on the roof. */
export const PANEL = {
  widthM: 1.7,
  heightM: 1.0,
  thicknessM: 0.04,
  ratedWp: 420,
} as const;

export interface PanelPlacement {
  /** Stable id: `${surfaceId}:${col},${row}`. */
  id: string;
  surfaceId: string;
  /** Panel center in world space (Y up, Z north), meters. */
  center: Vec3;
  /** In-plane width axis (unit), panel's long side. */
  u: Vec3;
  /** In-plane height axis (unit), up-slope. */
  v: Vec3;
  /** Surface outward normal (unit). */
  normal: Vec3;
}

export interface LayoutOptions {
  /** 0 = sparse (large gaps/margins), 1 = dense. */
  density: number;
  /** Skip near-vertical faces (e.g. gable ends), degrees. */
  maxTiltDeg?: number;
}

// --- tiny vec helpers ---
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function pointInPolygon(px: number, py: number, poly: { u: number; v: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    const intersect = a.v > py !== b.v > py && px < ((b.u - a.u) * (py - a.v)) / (b.v - a.v) + a.u;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Tile panels onto a single roof surface. */
export function layoutSurface(surface: RoofSurface, opts: LayoutOptions): PanelPlacement[] {
  const maxTilt = opts.maxTiltDeg ?? 70;
  if (surface.tiltDeg > maxTilt) return [];
  const poly = surface.polygon;
  if (poly.length < 3) return [];

  const o = poly[0];
  const e1 = sub(poly[1], o);
  const e2 = sub(poly[poly.length - 1], o);
  const normal = norm(cross(e1, e2));
  const u = norm(e1);
  const v = norm(cross(normal, u));

  const poly2d = poly.map((p) => ({ u: dot(sub(p, o), u), v: dot(sub(p, o), v) }));
  const minU = Math.min(...poly2d.map((p) => p.u));
  const maxU = Math.max(...poly2d.map((p) => p.u));
  const minV = Math.min(...poly2d.map((p) => p.v));
  const maxV = Math.max(...poly2d.map((p) => p.v));

  const d = Math.max(0, Math.min(1, opts.density));
  const gap = lerp(0.3, 0.02, d);
  const margin = lerp(0.6, 0.15, d);
  const w = PANEL.widthM;
  const h = PANEL.heightM;
  const stepU = w + gap;
  const stepV = h + gap;

  const placements: PanelPlacement[] = [];
  let row = 0;
  for (let cv = minV + margin; cv + h <= maxV - margin + 1e-9; cv += stepV, row++) {
    let col = 0;
    for (let cu = minU + margin; cu + w <= maxU - margin + 1e-9; cu += stepU, col++) {
      // require the whole panel (4 corners) to lie inside the face
      const corners = [
        [cu, cv],
        [cu + w, cv],
        [cu + w, cv + h],
        [cu, cv + h],
      ];
      if (corners.every(([pu, pv]) => pointInPolygon(pu, pv, poly2d))) {
        const centerU = cu + w / 2;
        const centerV = cv + h / 2;
        const center = add(o, add(scale(u, centerU), scale(v, centerV)));
        placements.push({
          id: `${surface.id}:${col},${row}`,
          surfaceId: surface.id,
          center,
          u,
          v,
          normal,
        });
      }
    }
  }
  return placements;
}

/** Lay out every roof surface in the geometry. */
export function layoutGeometry(geometry: RoofGeometry, opts: LayoutOptions): PanelPlacement[] {
  return geometry.surfaces.flatMap((s) => layoutSurface(s, opts));
}

/** Total kWp for a panel count. */
export const kWpFor = (panelCount: number): number => (panelCount * PANEL.ratedWp) / 1000;
