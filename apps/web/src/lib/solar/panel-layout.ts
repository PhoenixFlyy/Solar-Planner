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

export type ObstacleKind = "window" | "chimney" | "other";

/** A roof obstacle placed in a surface's 2D plane (u,v = center). */
export interface Obstacle {
  id: string;
  surfaceId: string;
  kind: ObstacleKind;
  u: number;
  v: number;
  widthM: number;
  heightM: number;
}

/** Default footprint per obstacle kind, meters. */
export const OBSTACLE_DEFAULTS: Record<ObstacleKind, { widthM: number; heightM: number }> = {
  window: { widthM: 1.2, heightM: 1.2 },
  chimney: { widthM: 0.6, heightM: 0.6 },
  other: { widthM: 1.0, heightM: 1.0 },
};

/** Clearance kept between panels and obstacles, meters. */
const OBSTACLE_CLEARANCE = 0.1;

export interface PlaneObstacle {
  u: number;
  v: number;
  widthM: number;
  heightM: number;
}

export interface LayoutOptions {
  /** 0 = sparse (large gaps/margins), 1 = dense. */
  density: number;
  /** Skip near-vertical faces (e.g. gable ends), degrees. */
  maxTiltDeg?: number;
  /** Obstacles on THIS surface (plane coords) whose area panels must avoid. */
  obstacles?: PlaneObstacle[];
}

export interface SurfaceBasis {
  o: Vec3;
  u: Vec3;
  v: Vec3;
  n: Vec3;
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

/** Orthonormal in-plane basis (o, u, v) + normal for a roof surface. */
export function surfaceBasis(poly: Vec3[]): SurfaceBasis {
  const o = poly[0];
  const e1 = sub(poly[1], o);
  const e2 = sub(poly[poly.length - 1], o);
  const n = norm(cross(e1, e2));
  const u = norm(e1);
  const v = norm(cross(n, u));
  return { o, u, v, n };
}

function overlapsObstacle(
  pcu: number,
  pcv: number,
  w: number,
  h: number,
  obstacles: PlaneObstacle[],
): boolean {
  for (const ob of obstacles) {
    const du = Math.abs(pcu - ob.u);
    const dv = Math.abs(pcv - ob.v);
    if (
      du < (w + ob.widthM) / 2 + OBSTACLE_CLEARANCE &&
      dv < (h + ob.heightM) / 2 + OBSTACLE_CLEARANCE
    ) {
      return true;
    }
  }
  return false;
}

/** Tile panels onto a single roof surface, skipping obstacle footprints. */
export function layoutSurface(surface: RoofSurface, opts: LayoutOptions): PanelPlacement[] {
  const maxTilt = opts.maxTiltDeg ?? 70;
  if (surface.tiltDeg > maxTilt) return [];
  const poly = surface.polygon;
  if (poly.length < 3) return [];

  const { o, u, v, n: normal } = surfaceBasis(poly);
  const obstacles = opts.obstacles ?? [];

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
      const centerU = cu + w / 2;
      const centerV = cv + h / 2;
      const insideFace = corners.every(([pu, pv]) => pointInPolygon(pu, pv, poly2d));
      if (insideFace && !overlapsObstacle(centerU, centerV, w, h, obstacles)) {
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

export interface GeometryLayoutOptions {
  density: number;
  maxTiltDeg?: number;
  /** All obstacles; routed to their surface by surfaceId. */
  obstacles?: Obstacle[];
}

/** Lay out every roof surface in the geometry, routing obstacles per surface. */
export function layoutGeometry(
  geometry: RoofGeometry,
  opts: GeometryLayoutOptions,
): PanelPlacement[] {
  const all = opts.obstacles ?? [];
  return geometry.surfaces.flatMap((s) =>
    layoutSurface(s, {
      density: opts.density,
      maxTiltDeg: opts.maxTiltDeg,
      obstacles: all.filter((ob) => ob.surfaceId === s.id),
    }),
  );
}

/** Project a world point onto a surface's plane, returning (u, v). */
export function projectToSurfaceUV(basis: SurfaceBasis, point: Vec3): { u: number; v: number } {
  const d = sub(point, basis.o);
  return { u: dot(d, basis.u), v: dot(d, basis.v) };
}

/** Convert in-plane (u, v) back to a world point on the surface. */
export function surfaceUVToWorld(basis: SurfaceBasis, u: number, v: number): Vec3 {
  return add(basis.o, add(scale(basis.u, u), scale(basis.v, v)));
}

/** In-plane bounding box (u/v extents) of a surface polygon. */
export function surfaceUVBounds(poly: Vec3[]): {
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
} {
  const basis = surfaceBasis(poly);
  const uv = poly.map((p) => projectToSurfaceUV(basis, p));
  return {
    minU: Math.min(...uv.map((p) => p.u)),
    maxU: Math.max(...uv.map((p) => p.u)),
    minV: Math.min(...uv.map((p) => p.v)),
    maxV: Math.max(...uv.map((p) => p.v)),
  };
}

/** Total kWp for a panel count. */
export const kWpFor = (panelCount: number): number => (panelCount * PANEL.ratedWp) / 1000;
