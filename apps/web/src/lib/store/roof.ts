// Roof editor client state (Zustand — one store per editor concern, CLAUDE.md).
// Holds the chosen template + params + panel layout + obstacles. Geometry and
// panel placements are derived in the component; persistence to Dexie is wired
// by the page that owns this concern.
import { create } from "zustand";

import type { RoofConfig } from "@/lib/db/db";
import { OBSTACLE_DEFAULTS, type Obstacle, type ObstacleKind } from "@/lib/solar/panel-layout";
import { getTemplate, type RoofParams, type RoofTemplateId } from "@/lib/templates";

const DEFAULT_DENSITY = 0.75;

interface RoofState {
  templateId: RoofTemplateId | null;
  params: RoofParams | null;
  selectedSurfaceId: string | null;
  panelDensity: number;
  removedPanelIds: Set<string>;
  obstacles: Obstacle[];
  selectedObstacleId: string | null;
  obstacleSeq: number;

  selectTemplate: (id: RoofTemplateId) => void;
  setParam: (key: string, value: number) => void;
  setParams: (params: RoofParams) => void;
  selectSurface: (id: string | null) => void;
  setPanelDensity: (density: number) => void;
  togglePanel: (id: string) => void;
  addObstacle: (kind: ObstacleKind, surfaceId: string, u: number, v: number) => void;
  moveObstacle: (id: string, u: number, v: number) => void;
  resizeObstacle: (id: string, widthM: number, heightM: number) => void;
  removeObstacle: (id: string) => void;
  selectObstacle: (id: string | null) => void;
  hydrate: (config: RoofConfig | null) => void;
  toConfig: () => RoofConfig | null;
}

export const useRoofStore = create<RoofState>((set, get) => ({
  templateId: null,
  params: null,
  selectedSurfaceId: null,
  panelDensity: DEFAULT_DENSITY,
  removedPanelIds: new Set(),
  obstacles: [],
  selectedObstacleId: null,
  obstacleSeq: 0,

  selectTemplate: (id) =>
    set({
      templateId: id,
      // Clone so edits never mutate the template's shared defaults object.
      params: { ...getTemplate(id).defaults },
      selectedSurfaceId: null,
      // A new template invalidates panel ids + obstacle surfaces; reset both.
      removedPanelIds: new Set(),
      obstacles: [],
      selectedObstacleId: null,
    }),

  setParam: (key, value) => set((s) => (s.params ? { params: { ...s.params, [key]: value } } : s)),

  setParams: (params) => set({ params: { ...params } }),

  selectSurface: (id) => set({ selectedSurfaceId: id }),

  setPanelDensity: (density) => set({ panelDensity: density, removedPanelIds: new Set() }),

  togglePanel: (id) =>
    set((s) => {
      const next = new Set(s.removedPanelIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { removedPanelIds: next };
    }),

  addObstacle: (kind, surfaceId, u, v) =>
    set((s) => {
      const id = `ob-${s.obstacleSeq}`;
      const { widthM, heightM } = OBSTACLE_DEFAULTS[kind];
      return {
        obstacles: [...s.obstacles, { id, surfaceId, kind, u, v, widthM, heightM }],
        obstacleSeq: s.obstacleSeq + 1,
        selectedObstacleId: id,
      };
    }),

  moveObstacle: (id, u, v) =>
    set((s) => ({
      obstacles: s.obstacles.map((ob) => (ob.id === id ? { ...ob, u, v } : ob)),
    })),

  resizeObstacle: (id, widthM, heightM) =>
    set((s) => ({
      obstacles: s.obstacles.map((ob) => (ob.id === id ? { ...ob, widthM, heightM } : ob)),
    })),

  removeObstacle: (id) =>
    set((s) => ({
      obstacles: s.obstacles.filter((ob) => ob.id !== id),
      selectedObstacleId: s.selectedObstacleId === id ? null : s.selectedObstacleId,
    })),

  selectObstacle: (id) => set({ selectedObstacleId: id }),

  hydrate: (config) =>
    set(
      config
        ? {
            templateId: config.templateId,
            params: { ...config.params },
            panelDensity: config.panelDensity ?? DEFAULT_DENSITY,
            removedPanelIds: new Set(config.removedPanelIds ?? []),
            obstacles: config.obstacles ?? [],
            obstacleSeq: (config.obstacles ?? []).length,
            selectedObstacleId: null,
          }
        : { templateId: null, params: null, obstacles: [], selectedObstacleId: null },
    ),

  toConfig: () => {
    const { templateId, params, panelDensity, removedPanelIds, obstacles } = get();
    return templateId && params
      ? {
          templateId,
          params,
          panelDensity,
          removedPanelIds: [...removedPanelIds],
          obstacles,
        }
      : null;
  },
}));
