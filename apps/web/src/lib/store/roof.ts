// Roof editor client state (Zustand — one store per editor concern, CLAUDE.md).
// Holds the chosen template + params + panel layout state. Geometry and panel
// placements are derived in the component; persistence to Dexie is wired by
// the page that owns this concern.
import { create } from "zustand";

import type { RoofConfig } from "@/lib/db/db";
import { getTemplate, type RoofParams, type RoofTemplateId } from "@/lib/templates";

const DEFAULT_DENSITY = 0.75;

interface RoofState {
  templateId: RoofTemplateId | null;
  params: RoofParams | null;
  selectedSurfaceId: string | null;
  panelDensity: number;
  removedPanelIds: Set<string>;

  selectTemplate: (id: RoofTemplateId) => void;
  setParam: (key: string, value: number) => void;
  setParams: (params: RoofParams) => void;
  selectSurface: (id: string | null) => void;
  setPanelDensity: (density: number) => void;
  togglePanel: (id: string) => void;
  hydrate: (config: RoofConfig | null) => void;
  toConfig: () => RoofConfig | null;
}

export const useRoofStore = create<RoofState>((set, get) => ({
  templateId: null,
  params: null,
  selectedSurfaceId: null,
  panelDensity: DEFAULT_DENSITY,
  removedPanelIds: new Set(),

  selectTemplate: (id) =>
    set({
      templateId: id,
      // Clone so edits never mutate the template's shared defaults object.
      params: { ...getTemplate(id).defaults },
      selectedSurfaceId: null,
      // A new template invalidates panel ids; clear manual removals.
      removedPanelIds: new Set(),
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

  hydrate: (config) =>
    set(
      config
        ? {
            templateId: config.templateId,
            params: { ...config.params },
            panelDensity: config.panelDensity ?? DEFAULT_DENSITY,
            removedPanelIds: new Set(config.removedPanelIds ?? []),
          }
        : { templateId: null, params: null },
    ),

  toConfig: () => {
    const { templateId, params, panelDensity, removedPanelIds } = get();
    return templateId && params
      ? { templateId, params, panelDensity, removedPanelIds: [...removedPanelIds] }
      : null;
  },
}));
