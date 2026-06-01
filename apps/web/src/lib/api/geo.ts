// Typed geo API calls. Types come from the generated OpenAPI client
// (@solar-planner/shared-types) — the canonical type-safety boundary.
import type { components } from "@solar-planner/shared-types";

import { apiGet, apiPost } from "./client";

export type GeocodeResult = components["schemas"]["GeocodeResult"];
export type GeocodeResponse = components["schemas"]["GeocodeResponse"];
export type Footprint = components["schemas"]["Footprint"];
export type FootprintResponse = components["schemas"]["FootprintResponse"];

export function geocode(query: string): Promise<GeocodeResponse> {
  return apiPost<GeocodeResponse>("/api/v1/geo/geocode", { query });
}

export function fetchFootprint(lat: number, lng: number): Promise<FootprintResponse> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  return apiGet<FootprintResponse>(`/api/v1/geo/footprint?${params.toString()}`);
}
