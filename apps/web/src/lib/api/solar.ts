// Typed solar API calls (yield). Types from the generated OpenAPI client.
import type { components } from "@solar-planner/shared-types";

import { apiPost } from "./client";

export type YieldRequest = components["schemas"]["YieldRequest"];
export type SystemYield = components["schemas"]["SystemYield"];
export type SurfaceYield = components["schemas"]["SurfaceYield"];

export function fetchSystemYield(request: YieldRequest): Promise<SystemYield> {
  return apiPost<SystemYield>("/api/v1/solar/yield", request);
}
