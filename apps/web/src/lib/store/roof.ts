// Roof editor client state (Zustand — one store per editor concern, CLAUDE.md).
// Holds the chosen template + params + selection. Geometry is derived in the
// component (useMemo over getTemplate(...).buildGeometry(params)); persistence
// to Dexie is wired by the page that owns this concern.
import { create } from "zustand";

import type { RoofConfig } from "@/lib/db/db";
import { getTemplate, type RoofParams, type RoofTemplateId } from "@/lib/templates";

interface RoofState {
  templateId: RoofTemplateId | null;
  params: RoofParams | null;
  selectedSurfaceId: string | null;

  selectTemplate: (id: RoofTemplateId) => void;
  setParam: (key: string, value: number) => void;
  selectSurface: (id: string | null) => void;
  hydrate: (config: RoofConfig | null) => void;
  toConfig: () => RoofConfig | null;
}

export const useRoofStore = create<RoofState>((set, get) => ({
  templateId: null,
  params: null,
  selectedSurfaceId: null,

  selectTemplate: (id) =>
    set({
      templateId: id,
      // Clone so edits never mutate the template's shared defaults object.
      params: { ...getTemplate(id).defaults },
      selectedSurfaceId: null,
    }),

  setParam: (key, value) => set((s) => (s.params ? { params: { ...s.params, [key]: value } } : s)),

  selectSurface: (id) => set({ selectedSurfaceId: id }),

  hydrate: (config) =>
    set(
      config
        ? { templateId: config.templateId, params: { ...config.params } }
        : { templateId: null, params: null },
    ),

  toConfig: () => {
    const { templateId, params } = get();
    return templateId && params ? { templateId, params } : null;
  },
}));
