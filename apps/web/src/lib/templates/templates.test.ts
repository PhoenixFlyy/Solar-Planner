import { describe, expect, it } from "vitest";

import { ROOF_TEMPLATES, buildGable, getTemplate, type GableParams, type HipParams } from "./index";

describe("roof template registry", () => {
  it("roofTemplates_mvpSet_hasFiveTemplates", () => {
    expect(ROOF_TEMPLATES.map((t) => t.id)).toEqual([
      "satteldach",
      "pultdach",
      "walmdach",
      "flachdach",
      "reihenhaus-sattel",
    ]);
  });

  it("roofTemplates_everyTemplate_buildsFromItsDefaults", () => {
    for (const t of ROOF_TEMPLATES) {
      const g = t.buildGeometry(t.defaults);
      expect(g.templateId).toBe(t.id);
      expect(g.surfaces.length).toBeGreaterThan(0);
      for (const s of g.surfaces) {
        expect(s.areaM2).toBeGreaterThan(0);
        expect(s.azimuthDeg).toBeGreaterThanOrEqual(0);
        expect(s.azimuthDeg).toBeLessThan(360);
        expect(s.polygon.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("satteldach (gable)", () => {
  const g = getTemplate("satteldach").buildGeometry(getTemplate("satteldach").defaults);

  it("roofTemplate_satteldach_hasTwoOppositeSlopes", () => {
    expect(g.surfaces).toHaveLength(2);
    const [front, back] = g.surfaces;
    expect(front.azimuthDeg).toBe(180);
    expect(back.azimuthDeg).toBe(0);
  });

  it("roofTemplate_satteldach_computesTiltAndAreaFromDimensions", () => {
    // span 9 (run 4.5), rise 3 -> tilt atan2(3,4.5), slope 5.408, area*11.
    const [front] = g.surfaces;
    expect(front.tiltDeg).toBeCloseTo(33.69, 1);
    expect(front.areaM2).toBeCloseTo(59.49, 1);
  });

  it("roofTemplate_satteldach_roofAreaExceedsFootprint", () => {
    const roof = g.surfaces.reduce((a, s) => a + s.areaM2, 0);
    const footprint = g.footprintWidthM * g.footprintDepthM;
    expect(roof).toBeGreaterThan(footprint);
  });
});

describe("gable orientation", () => {
  const base: GableParams = {
    spanM: 9,
    lengthM: 11,
    eaveHeightM: 5,
    ridgeHeightM: 8,
    azimuthDeg: 90, // face east
  };
  const g = buildGable(base, "satteldach");

  it("roofTemplate_gable_whenAzimuthEast_frontFacesEastBackFacesWest", () => {
    const [front, back] = g.surfaces;
    expect(front.azimuthDeg).toBe(90);
    expect(back.azimuthDeg).toBe(270);
  });

  it("roofTemplate_gable_orientationPreservesTiltAndArea", () => {
    const south = buildGable({ ...base, azimuthDeg: 180 }, "satteldach");
    expect(g.surfaces[0].tiltDeg).toBeCloseTo(south.surfaces[0].tiltDeg, 6);
    expect(g.surfaces[0].areaM2).toBeCloseTo(south.surfaces[0].areaM2, 6);
  });
});

describe("pultdach (mono-pitch)", () => {
  const g = getTemplate("pultdach").buildGeometry(getTemplate("pultdach").defaults);

  it("roofTemplate_pultdach_hasSingleSouthSlope", () => {
    expect(g.surfaces).toHaveLength(1);
    expect(g.surfaces[0].azimuthDeg).toBe(180);
    // width 8 (run), rise 3 -> tilt atan2(3,8), slope 8.544, area*11.
    expect(g.surfaces[0].tiltDeg).toBeCloseTo(20.56, 1);
    expect(g.surfaces[0].areaM2).toBeCloseTo(93.98, 1);
  });
});

describe("walmdach (hip)", () => {
  const g = getTemplate("walmdach").buildGeometry(getTemplate("walmdach").defaults);

  it("roofTemplate_walmdach_hasFourSlopes", () => {
    expect(g.surfaces).toHaveLength(4);
    expect(g.surfaces.map((s) => s.azimuthDeg).sort((a, b) => a - b)).toEqual([0, 90, 180, 270]);
  });

  it("roofTemplate_walmdach_hipEndsAreTrianglesSteeperThanLongSides", () => {
    const front = g.surfaces.find((s) => s.id === "front")!;
    const hip = g.surfaces.find((s) => s.id === "hipEast")!;
    expect(hip.polygon).toHaveLength(3);
    expect(front.polygon).toHaveLength(4);
    expect(hip.tiltDeg).toBeGreaterThan(front.tiltDeg); // hipInset 2.5 < run 4.5
  });

  it("roofTemplate_walmdach_withZeroHipInset_longSidesMatchGableAndEndsGoVertical", () => {
    const params = { ...(getTemplate("walmdach").defaults as HipParams), hipInsetM: 0 };
    const hip = getTemplate("walmdach").buildGeometry(params);
    const gable = buildGable(
      { spanM: 9, lengthM: 11, eaveHeightM: 5, ridgeHeightM: 8, azimuthDeg: 180 },
      "satteldach",
    );
    const hipFront = hip.surfaces.find((s) => s.id === "front")!;
    const hipEnd = hip.surfaces.find((s) => s.id === "hipEast")!;
    // With no inset the trapezoids become full rectangles == the gable slopes,
    // and the hip ends degenerate into vertical (90°) gable-wall triangles.
    expect(hipFront.areaM2).toBeCloseTo(gable.surfaces[0].areaM2, 4);
    expect(hipEnd.tiltDeg).toBeCloseTo(90, 6);
  });
});

describe("flachdach (flat)", () => {
  const g = getTemplate("flachdach").buildGeometry(getTemplate("flachdach").defaults);

  it("roofTemplate_flachdach_isHorizontalDeckEqualToFootprint", () => {
    expect(g.surfaces).toHaveLength(1);
    expect(g.surfaces[0].tiltDeg).toBe(0);
    expect(g.surfaces[0].areaM2).toBeCloseTo(99, 6);
    expect(g.ridgeHeightM).toBeCloseTo(6.4, 6); // roof + parapet
  });
});
