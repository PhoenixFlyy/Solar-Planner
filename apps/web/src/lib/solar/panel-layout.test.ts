import { describe, expect, it } from "vitest";

import type { RoofSurface, Vec3 } from "@/lib/templates";
import { kWpFor, layoutSurface, PANEL } from "./panel-layout";

// A horizontal rectangular face (u along +X, v along +Z) for deterministic tests.
function rectSurface(widthU: number, heightV: number, tiltDeg = 20): RoofSurface {
  const poly: Vec3[] = [
    [0, 0, 0],
    [widthU, 0, 0],
    [widthU, 0, heightV],
    [0, 0, heightV],
  ];
  return {
    id: "s",
    nameKey: "s",
    azimuthDeg: 180,
    tiltDeg,
    areaM2: widthU * heightV,
    polygon: poly,
  };
}

describe("layoutSurface", () => {
  it("panelLayout_rectangle_placesPanelsWithinBounds", () => {
    const placed = layoutSurface(rectSurface(8, 6), { density: 0.7 });
    expect(placed.length).toBeGreaterThan(8);
    // every panel center is inside the face bounds
    for (const p of placed) {
      expect(p.center[0]).toBeGreaterThan(0);
      expect(p.center[0]).toBeLessThan(8);
      expect(p.center[2]).toBeGreaterThan(0);
      expect(p.center[2]).toBeLessThan(6);
    }
  });

  it("panelLayout_denser_fitsAtLeastAsMany", () => {
    const sparse = layoutSurface(rectSurface(8, 6), { density: 0 });
    const dense = layoutSurface(rectSurface(8, 6), { density: 1 });
    expect(dense.length).toBeGreaterThanOrEqual(sparse.length);
    expect(dense.length).toBeGreaterThan(0);
  });

  it("panelLayout_verticalFace_isSkipped", () => {
    expect(layoutSurface(rectSurface(8, 6, 90), { density: 0.7 })).toHaveLength(0);
  });

  it("panelLayout_triangle_fitsFewerThanItsBoundingRectangle", () => {
    const rect = layoutSurface(rectSurface(8, 6), { density: 0.7 });
    const triangle: RoofSurface = {
      id: "t",
      nameKey: "t",
      azimuthDeg: 180,
      tiltDeg: 20,
      areaM2: 24,
      polygon: [
        [0, 0, 0],
        [8, 0, 0],
        [4, 0, 6],
      ],
    };
    const tri = layoutSurface(triangle, { density: 0.7 });
    expect(tri.length).toBeLessThan(rect.length);
  });

  it("panelLayout_panelIdsAreUnique", () => {
    const placed = layoutSurface(rectSurface(8, 6), { density: 0.7 });
    expect(new Set(placed.map((p) => p.id)).size).toBe(placed.length);
  });
});

describe("kWpFor", () => {
  it("kWpFor_usesRatedWattPeak", () => {
    expect(kWpFor(10)).toBeCloseTo((10 * PANEL.ratedWp) / 1000, 6);
  });
});
