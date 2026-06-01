// Small geometry helpers for roof templates. Pure, framework-agnostic.
import type { Vec3 } from "./types";

export const deg2rad = (d: number): number => (d * Math.PI) / 180;
export const rad2deg = (r: number): number => (r * 180) / Math.PI;

/** Normalize an angle to [0, 360). */
export const norm360 = (a: number): number => ((a % 360) + 360) % 360;

/**
 * Rotate a point around the world Y axis (vertical) by `deg`, measured so a
 * surface's compass azimuth advances clockwise N→E→S→W to match pvlib.
 */
export function rotateY([x, y, z]: Vec3, deg: number): Vec3 {
  const r = deg2rad(deg);
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  // Clockwise (viewed from above, +Y down): +Z (north) rotates toward +X (east).
  return [x * cos + z * sin, y, -x * sin + z * cos];
}

/** Pitch (degrees from horizontal) of a slope with the given run and rise. */
export function tiltDeg(runM: number, riseM: number): number {
  return rad2deg(Math.atan2(riseM, runM));
}

/** Slant length of a slope with the given horizontal run and vertical rise. */
export const slant = (runM: number, riseM: number): number => Math.hypot(runM, riseM);
