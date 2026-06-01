// Client-side solar position so the time-slider updates the sun with no API
// round-trip. pvlib is authoritative (ADR-0004); this NOAA low-precision
// implementation is validated against pvlib for reference locations in
// sun-position.test.ts (tolerance ~1.5°). The pvlib endpoint
// (GET /api/v1/solar/sun-position) remains the reference of record.
import type { Vec3 } from "@/lib/templates";

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const mod360 = (a: number): number => ((a % 360) + 360) % 360;

export interface SunPosition {
  /** Compass azimuth, pvlib frame: 0=N, 90=E, 180=S, 270=W. */
  azimuthDeg: number;
  /** Elevation above the horizon, degrees (negative = below horizon). */
  elevationDeg: number;
}

/** Solar position for an instant (UTC) and location. */
export function sunPosition(dateUtc: Date, latDeg: number, lngDeg: number): SunPosition {
  const jd = dateUtc.getTime() / 86_400_000 + 2440587.5;
  const n = jd - 2451545.0; // days since J2000.0

  const meanLong = mod360(280.46 + 0.9856474 * n);
  const meanAnom = mod360(357.528 + 0.9856003 * n) * RAD;
  const eclLong = (meanLong + 1.915 * Math.sin(meanAnom) + 0.02 * Math.sin(2 * meanAnom)) * RAD;
  const obliquity = (23.439 - 0.0000004 * n) * RAD;

  const sinL = Math.sin(eclLong);
  const decl = Math.asin(Math.sin(obliquity) * sinL);
  const ra = Math.atan2(Math.cos(obliquity) * sinL, Math.cos(eclLong));

  const gmst = mod360(280.46061837 + 360.98564736629 * n);
  const lst = mod360(gmst + lngDeg) * RAD;
  const H = lst - ra; // hour angle

  const lat = latDeg * RAD;
  const elevation = Math.asin(
    Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H),
  );
  // Azimuth from south, positive west; shift +180 to the pvlib from-north frame.
  const azSouth = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat),
  );

  return {
    azimuthDeg: mod360(azSouth * DEG + 180),
    elevationDeg: elevation * DEG,
  };
}

/**
 * Direction vector pointing TOWARD the sun in the scene frame
 * (X east, Y up, Z north). Use for a directional light's position.
 */
export function sunDirection(azimuthDeg: number, elevationDeg: number): Vec3 {
  const az = azimuthDeg * RAD;
  const el = elevationDeg * RAD;
  const cosEl = Math.cos(el);
  return [cosEl * Math.sin(az), Math.sin(el), cosEl * Math.cos(az)];
}
