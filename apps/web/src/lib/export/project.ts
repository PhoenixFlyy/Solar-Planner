// Project JSON export/import (full project for re-import). Versioned so future
// schema changes can migrate. Pure — DOM download lives in download.ts.
import type { PlannerProject } from "@/lib/db/db";

export const PROJECT_EXPORT_VERSION = 1;

export interface ProjectExport {
  version: number;
  project: Omit<PlannerProject, "id" | "updatedAt">;
}

export function serializeProject(project: PlannerProject): string {
  const { id: _id, updatedAt: _updatedAt, ...rest } = project;
  const payload: ProjectExport = { version: PROJECT_EXPORT_VERSION, project: rest };
  return JSON.stringify(payload, null, 2);
}

/** Parse an exported project; returns the project fields or null if invalid. */
export function parseProject(text: string): ProjectExport["project"] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    typeof data !== "object" ||
    data === null ||
    !("version" in data) ||
    !("project" in data) ||
    typeof (data as ProjectExport).project !== "object"
  ) {
    return null;
  }
  return (data as ProjectExport).project;
}
