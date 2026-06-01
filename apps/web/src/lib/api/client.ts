// Thin typed fetch wrapper around the FastAPI backend. Components never call
// fetch directly — they go through TanStack Query hooks that use these.
// Types come from the generated @solar-planner/shared-types (codegen boundary).

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** GET a JSON resource from the API. Throws ApiError on non-2xx. */
export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

/** POST a JSON body to the API. Throws ApiError on non-2xx. */
export async function apiPost<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    throw new ApiError(res.status, `POST ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export function getHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/api/v1/health");
}
