import { describe, expect, it } from "vitest";

import type { PlannerProject } from "@/lib/db/db";
import { parseProject, serializeProject } from "./project";
import { decodeShare, encodeShare } from "./share";

const project: PlannerProject = {
  id: "current",
  address: "Teststraße 1, Berlin",
  location: { label: "Teststraße 1", lat: 52.52, lng: 13.405 },
  footprint: null,
  roof: {
    templateId: "satteldach",
    params: { spanM: 9, lengthM: 11, eaveHeightM: 5, ridgeHeightM: 8, azimuthDeg: 180 },
    panelDensity: 0.75,
    removedPanelIds: [],
    obstacles: [],
  },
  economics: { persons: 3, eCar: true, heatPump: false, storageKwh: 6 },
  updatedAt: 123,
};

describe("project serialize/parse", () => {
  it("project_roundTrip_preservesFields", () => {
    const parsed = parseProject(serializeProject(project));
    expect(parsed).not.toBeNull();
    expect(parsed!.address).toBe(project.address);
    expect(parsed!.roof?.templateId).toBe("satteldach");
    expect(parsed!.economics?.persons).toBe(3);
  });

  it("project_dropsVolatileIdAndTimestamp", () => {
    const parsed = parseProject(serializeProject(project)) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("id");
    expect(parsed).not.toHaveProperty("updatedAt");
  });

  it("project_invalidJson_returnsNull", () => {
    expect(parseProject("not json")).toBeNull();
    expect(parseProject("{}")).toBeNull();
  });
});

describe("share encode/decode", () => {
  it("share_roundTrip_recoversProject", () => {
    const decoded = decodeShare(encodeShare(project));
    expect(decoded).not.toBeNull();
    expect(decoded!.address).toBe(project.address);
    expect(decoded!.location?.lat).toBe(52.52);
  });

  it("share_garbage_returnsNull", () => {
    expect(decodeShare("!!!not-base64!!!")).toBeNull();
  });
});
