import { describe, expect, it } from "vitest";

import { sunDirection, sunPosition } from "./sun-position";

// Reference values from the authoritative pvlib endpoint (apparent position).
// Tolerance ~1.5° covers the NOAA low-precision model + refraction.
const REFERENCES = [
  {
    name: "Berlin summer",
    lat: 52.52,
    lng: 13.405,
    iso: "2025-06-21T10:00:00Z",
    az: 149.347,
    el: 58.153,
  },
  {
    name: "Berlin winter",
    lat: 52.52,
    lng: 13.405,
    iso: "2025-12-21T11:00:00Z",
    az: 178.926,
    el: 14.098,
  },
  {
    name: "Munich autumn",
    lat: 48.137,
    lng: 11.575,
    iso: "2025-09-23T12:00:00Z",
    az: 197.795,
    el: 40.196,
  },
];

describe("sunPosition vs pvlib", () => {
  for (const r of REFERENCES) {
    it(`sunPosition_${r.name.replace(/\s/g, "")}_matchesPvlibWithin1p5deg`, () => {
      const sp = sunPosition(new Date(r.iso), r.lat, r.lng);
      expect(Math.abs(sp.azimuthDeg - r.az)).toBeLessThan(1.5);
      expect(Math.abs(sp.elevationDeg - r.el)).toBeLessThan(1.5);
    });
  }

  it("sunPosition_midnight_isBelowHorizon", () => {
    const sp = sunPosition(new Date("2025-06-21T00:00:00Z"), 52.52, 13.405);
    expect(sp.elevationDeg).toBeLessThan(0);
  });
});

describe("sunDirection", () => {
  it("sunDirection_southNoon_pointsSouthAndUp", () => {
    const [x, y, z] = sunDirection(180, 45);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeGreaterThan(0); // up
    expect(z).toBeLessThan(0); // south is -Z
  });

  it("sunDirection_east_pointsEast", () => {
    const [x, , z] = sunDirection(90, 10);
    expect(x).toBeGreaterThan(0); // east is +X
    expect(z).toBeCloseTo(0, 6);
  });
});
