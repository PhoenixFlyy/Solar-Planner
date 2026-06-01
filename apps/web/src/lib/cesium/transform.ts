// Convert the planner's local frame (x=east, y=up, z=north, meters) to/from
// Cesium ECEF via an East-North-Up frame anchored at the site. Cesium's ENU
// axes are (x=east, y=north, z=up), so our (x,y,z) maps to ENU (x, z, y).
import { Cartesian3, Matrix4, Transforms } from "cesium";

import type { Vec3 } from "@/lib/templates";

export interface SiteFrame {
  enu: Matrix4;
  invEnu: Matrix4;
  origin: Cartesian3;
}

export function siteFrame(lat: number, lng: number, heightM: number): SiteFrame {
  const origin = Cartesian3.fromDegrees(lng, lat, heightM);
  const enu = Transforms.eastNorthUpToFixedFrame(origin);
  const invEnu = Matrix4.inverse(enu, new Matrix4());
  return { enu, invEnu, origin };
}

/** Local [x=east, y=up, z=north] → ECEF Cartesian3. */
export function localToCartesian(frame: SiteFrame, [x, y, z]: Vec3): Cartesian3 {
  return Matrix4.multiplyByPoint(frame.enu, new Cartesian3(x, z, y), new Cartesian3());
}

export function localPolygon(frame: SiteFrame, ring: Vec3[]): Cartesian3[] {
  return ring.map((p) => localToCartesian(frame, p));
}

/** ECEF Cartesian3 → local [x=east, y=up, z=north]. */
export function cartesianToLocal(frame: SiteFrame, cart: Cartesian3): Vec3 {
  const e = Matrix4.multiplyByPoint(frame.invEnu, cart, new Cartesian3());
  return [e.x, e.z, e.y];
}
