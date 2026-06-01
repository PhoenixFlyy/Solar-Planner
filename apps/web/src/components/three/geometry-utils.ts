// Build Three.js BufferGeometries from the template's plain polygon data.
// Kept separate from React so it is easy to unit-test and reuse.
import * as THREE from "three";

import type { Vec3 } from "@/lib/templates";

/** Triangulate a (convex) polygon ring into a BufferGeometry via a fan. */
export function polygonGeometry(points: Vec3[]): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    verts.push(...points[0], ...points[i], ...points[i + 1]);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Vertical side walls extruding a ground ring up to `height`. */
export function wallsGeometry(ground: Vec3[], height: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts: number[] = [];
  const n = ground.length;
  for (let i = 0; i < n; i++) {
    const a = ground[i];
    const b = ground[(i + 1) % n];
    const a0: Vec3 = [a[0], 0, a[2]];
    const b0: Vec3 = [b[0], 0, b[2]];
    const a1: Vec3 = [a[0], height, a[2]];
    const b1: Vec3 = [b[0], height, b[2]];
    verts.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}
