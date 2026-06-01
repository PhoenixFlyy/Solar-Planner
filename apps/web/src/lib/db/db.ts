// Anon-first local persistence (ADR-0002). IndexedDB via Dexie — never
// localStorage for project data. The schema mirrors the backend domain
// models so an account sync is a straight INSERT/SELECT later.
import Dexie, { type Table } from "dexie";

export interface StoredLatLng {
  lat: number;
  lng: number;
}

export interface StoredLocation {
  label: string;
  lat: number;
  lng: number;
}

export interface PlannerProject {
  /** Single current project in MVP (multi-project is Phase 2). */
  id: string;
  address: string;
  location: StoredLocation | null;
  footprint: { points: StoredLatLng[] } | null;
  updatedAt: number;
}

class SolarPlannerDB extends Dexie {
  projects!: Table<PlannerProject, string>;

  constructor() {
    super("solar-planner");
    this.version(1).stores({
      // Primary key only; the project is small and loaded whole.
      projects: "id",
    });
  }
}

export const db = new SolarPlannerDB();

/** The id of the single current project in MVP. */
export const CURRENT_PROJECT_ID = "current";

export async function saveProject(patch: Partial<Omit<PlannerProject, "id" | "updatedAt">>) {
  const existing = await db.projects.get(CURRENT_PROJECT_ID);
  const next: PlannerProject = {
    id: CURRENT_PROJECT_ID,
    address: "",
    location: null,
    footprint: null,
    ...existing,
    ...patch,
    updatedAt: Date.now(),
  };
  await db.projects.put(next);
  return next;
}
