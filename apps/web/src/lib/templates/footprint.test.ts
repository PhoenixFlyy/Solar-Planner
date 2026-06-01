import { describe, expect, it } from "vitest";

import { applyDimensions, footprintDimensions, type FootprintLatLng } from "./footprint";
import type { GableParams, MonoParams } from "./types";

// Build a rectangular footprint of (ewMeters × nsMeters) centered at (lat,lng).
function rectFootprint(ewM: number, nsM: number, lat = 52, lng = 13): FootprintLatLng[] {
  const dLat = nsM / 2 / 111_320;
  const dLng = ewM / 2 / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [
    { lat: lat - dLat, lng: lng - dLng },
    { lat: lat - dLat, lng: lng + dLng },
    { lat: lat + dLat, lng: lng + dLng },
    { lat: lat + dLat, lng: lng - dLng },
  ];
}

describe("footprintDimensions", () => {
  it("footprint_square_hasEqualLengthAndSpan", () => {
    const d = footprintDimensions(rectFootprint(10, 10))!;
    expect(d.lengthM).toBeCloseTo(10, 0);
    expect(d.spanM).toBeCloseTo(10, 0);
  });

  it("footprint_wideRectangle_lengthIsLongerAxisSpanIsShorter", () => {
    const d = footprintDimensions(rectFootprint(20, 8))!;
    expect(d.lengthM).toBeCloseTo(20, 0);
    expect(d.spanM).toBeCloseTo(8, 0);
  });

  it("footprint_eastWestRidge_primarySlopeFacesSouth", () => {
    // 20m E-W (ridge) × 8m N-S -> slopes face N/S; south bias picks 180.
    const d = footprintDimensions(rectFootprint(20, 8))!;
    expect(d.azimuthDeg).toBe(180);
  });

  it("footprint_tooFewPoints_returnsNull", () => {
    expect(footprintDimensions([{ lat: 52, lng: 13 }])).toBeNull();
  });
});

describe("applyDimensions", () => {
  const dims = { lengthM: 12, spanM: 7, azimuthDeg: 200 };

  it("applyDimensions_gable_setsSpanLengthAndAzimuth", () => {
    const params: GableParams = {
      spanM: 9,
      lengthM: 11,
      eaveHeightM: 5,
      ridgeHeightM: 8,
      azimuthDeg: 180,
    };
    const out = applyDimensions(params, dims) as GableParams;
    expect(out.lengthM).toBe(12);
    expect(out.spanM).toBe(7);
    expect(out.azimuthDeg).toBe(200);
    expect(out.ridgeHeightM).toBe(8); // unrelated keys untouched
  });

  it("applyDimensions_mono_mapsSpanToWidth", () => {
    const params: MonoParams = {
      widthM: 8,
      lengthM: 11,
      lowEaveHeightM: 4,
      highEaveHeightM: 7,
      azimuthDeg: 180,
    };
    const out = applyDimensions(params, dims) as MonoParams;
    expect(out.widthM).toBe(7);
    expect(out.lengthM).toBe(12);
  });
});
