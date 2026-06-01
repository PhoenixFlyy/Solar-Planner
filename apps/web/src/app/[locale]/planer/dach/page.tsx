"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";

import { CURRENT_PROJECT_ID, db, saveProject } from "@/lib/db/db";
import { useRoofStore } from "@/lib/store/roof";
import { applyDimensions, footprintDimensions, getTemplate } from "@/lib/templates";
import { sunPosition } from "@/lib/solar/sun-position";
import {
  kWpFor,
  layoutGeometry,
  PANEL,
  projectToSurfaceUV,
  surfaceBasis,
  type ObstacleKind,
} from "@/lib/solar/panel-layout";
import { fetchSystemYield } from "@/lib/api/solar";
import { Link } from "@/i18n/navigation";
import { TemplatePicker } from "@/components/planner/TemplatePicker";
import { RoofParamSliders } from "@/components/planner/RoofParamSliders";
import { SunControls, type SunTime } from "@/components/planner/SunControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

// Berlin fallback when no location has been chosen yet.
const DEFAULT_LOCATION = { lat: 52.52, lng: 13.405 };

// R3F is client-only (WebGL) — never SSR it.
const RoofScene = dynamic(() => import("@/components/three/RoofScene").then((m) => m.RoofScene), {
  ssr: false,
  loading: () => <div className="h-[28rem] w-full animate-pulse rounded-lg bg-neutral-100" />,
});

// Cesium real-world view (ADR-0008) — only used when a token is configured.
const CesiumScene = dynamic(
  () => import("@/components/three/CesiumScene").then((m) => m.CesiumScene),
  {
    ssr: false,
    loading: () => <div className="h-[28rem] w-full animate-pulse rounded-lg bg-sky-100" />,
  },
);
const CESIUM_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;

export default function DachPage() {
  const t = useTranslations("Dach");

  const templateId = useRoofStore((s) => s.templateId);
  const params = useRoofStore((s) => s.params);
  const selectedSurfaceId = useRoofStore((s) => s.selectedSurfaceId);
  const selectTemplate = useRoofStore((s) => s.selectTemplate);
  const setParam = useRoofStore((s) => s.setParam);
  const setParams = useRoofStore((s) => s.setParams);
  const selectSurface = useRoofStore((s) => s.selectSurface);
  const panelDensity = useRoofStore((s) => s.panelDensity);
  const removedPanelIds = useRoofStore((s) => s.removedPanelIds);
  const setPanelDensity = useRoofStore((s) => s.setPanelDensity);
  const togglePanel = useRoofStore((s) => s.togglePanel);
  const obstacles = useRoofStore((s) => s.obstacles);
  const selectedObstacleId = useRoofStore((s) => s.selectedObstacleId);
  const addObstacle = useRoofStore((s) => s.addObstacle);
  const moveObstacle = useRoofStore((s) => s.moveObstacle);
  const resizeObstacle = useRoofStore((s) => s.resizeObstacle);
  const removeObstacle = useRoofStore((s) => s.removeObstacle);
  const selectObstacle = useRoofStore((s) => s.selectObstacle);
  const hydrate = useRoofStore((s) => s.hydrate);
  const toConfig = useRoofStore((s) => s.toConfig);

  const [armedKind, setArmedKind] = useState<ObstacleKind | null>(null);
  const [view, setView] = useState<"editor" | "real">("editor");

  // Hydrate the editor once from Dexie (null = loaded-but-absent).
  const stored = useLiveQuery(() => db.projects.get(CURRENT_PROJECT_ID).then((p) => p ?? null), []);
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current && stored !== undefined) {
      hydrate(stored?.roof ?? null);
      hydrated.current = true;
    }
  }, [stored, hydrate]);

  // Persist roof config on change (after hydration).
  useEffect(() => {
    if (hydrated.current && templateId && params) {
      const roof = toConfig();
      if (roof) void saveProject({ roof });
    }
  }, [templateId, params, panelDensity, removedPanelIds, obstacles, toConfig]);

  const geometry = useMemo(
    () => (templateId && params ? getTemplate(templateId).buildGeometry(params) : null),
    [templateId, params],
  );

  const totalAreaM2 = geometry ? geometry.surfaces.reduce((a, s) => a + s.areaM2, 0) : 0;
  const loc = stored?.location ?? DEFAULT_LOCATION;

  // Auto-layout panels; obstacles carve out area, removals trim the count.
  const placements = useMemo(
    () => (geometry ? layoutGeometry(geometry, { density: panelDensity, obstacles }) : []),
    [geometry, panelDensity, obstacles],
  );
  const panelCount = placements.filter((p) => !removedPanelIds.has(p.id)).length;
  const kWp = kWpFor(panelCount);

  // Installed kWp per surface (visible panels) → yield request.
  const kwpBySurface = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of placements) {
      if (!removedPanelIds.has(p.id))
        m.set(p.surfaceId, (m.get(p.surfaceId) ?? 0) + PANEL.ratedWp / 1000);
    }
    return m;
  }, [placements, removedPanelIds]);

  const yieldSurfaces = useMemo(
    () =>
      geometry
        ? geometry.surfaces
            .filter((s) => (kwpBySurface.get(s.id) ?? 0) > 0)
            .map((s) => ({
              id: s.id,
              tilt: s.tiltDeg,
              azimuth: s.azimuthDeg,
              kwp: kwpBySurface.get(s.id) ?? 0,
            }))
        : [],
    [geometry, kwpBySurface],
  );

  const [heatmap, setHeatmap] = useState(false);
  const yieldQuery = useQuery({
    queryKey: ["yield", loc.lat, loc.lng, JSON.stringify(yieldSurfaces)],
    queryFn: () => fetchSystemYield({ lat: loc.lat, lng: loc.lng, surfaces: yieldSurfaces }),
    enabled: heatmap && yieldSurfaces.length > 0,
  });

  // Per-surface specific yield → normalized heatmap color (blue low → red high).
  const panelColorFor = useMemo(() => {
    const data = yieldQuery.data;
    if (!heatmap || !data) return undefined;
    const bySurface = new Map(data.per_surface.map((s) => [s.surface_id, s.specific_kwh_per_kwp]));
    const vals = [...bySurface.values()];
    if (vals.length === 0) return undefined;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    return (p: { surfaceId: string }) => {
      const v = bySurface.get(p.surfaceId);
      if (v === undefined) return "#1e3a8a";
      const tNorm = max > min ? (v - min) / (max - min) : 0.5;
      return `hsl(${Math.round((1 - tNorm) * 240)}, 80%, 50%)`;
    };
  }, [heatmap, yieldQuery.data]);

  // Place an armed obstacle where the user clicked a roof face; else select.
  function handleSurfaceClick(surfaceId: string, point: [number, number, number]) {
    if (!armedKind || !geometry) {
      selectSurface(surfaceId);
      return;
    }
    const surface = geometry.surfaces.find((s) => s.id === surfaceId);
    if (!surface) return;
    const { u, v } = projectToSurfaceUV(surfaceBasis(surface.polygon), point);
    const snap = (n: number) => Math.round(n / 0.5) * 0.5;
    addObstacle(armedKind, surfaceId, snap(u), snap(v));
    setArmedKind(null);
  }

  // Sun / time-of-year for the live light + shadows.
  const [sunTime, setSunTime] = useState<SunTime>({ month: 6, day: 21, hour: 12 });
  const sun = useMemo(() => {
    // Approximate CET (UTC+1); DST ignored for a schematic sun.
    const date = new Date(Date.UTC(2025, sunTime.month - 1, sunTime.day, sunTime.hour - 1, 0));
    return sunPosition(date, loc.lat, loc.lng);
  }, [sunTime, loc.lat, loc.lng]);

  const footprintPoints = stored?.footprint?.points ?? null;
  function applyFootprint() {
    if (!footprintPoints || !params) return;
    const dims = footprintDimensions(footprintPoints);
    if (dims) setParams(applyDimensions(params, dims));
  }

  const selectedObstacle = obstacles.find((o) => o.id === selectedObstacleId) ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/planer">{t("back")}</Link>
        </Button>
      </div>

      <TemplatePicker selectedId={templateId} onSelect={selectTemplate} />

      {footprintPoints && params && (
        <Button variant="outline" size="sm" className="self-start" onClick={applyFootprint}>
          {t("useFootprint")}
        </Button>
      )}

      {geometry && params && (
        <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="flex flex-col gap-3">
            {CESIUM_TOKEN && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={view === "editor" ? "default" : "outline"}
                  onClick={() => setView("editor")}
                >
                  {t("viewEditor")}
                </Button>
                <Button
                  size="sm"
                  variant={view === "real" ? "default" : "outline"}
                  onClick={() => setView("real")}
                >
                  {t("viewReal")}
                </Button>
              </div>
            )}

            {view === "real" && CESIUM_TOKEN ? (
              <CesiumScene lat={loc.lat} lng={loc.lng} token={CESIUM_TOKEN} />
            ) : (
              <RoofScene
                geometry={geometry}
                selectedSurfaceId={selectedSurfaceId}
                onSelectSurface={handleSurfaceClick}
                sun={sun}
                panels={placements}
                removedPanels={removedPanelIds}
                onTogglePanel={togglePanel}
                panelColorFor={panelColorFor}
                obstacles={obstacles}
                selectedObstacleId={selectedObstacleId}
                onMoveObstacle={moveObstacle}
                onSelectObstacle={selectObstacle}
              />
            )}
            <p className="text-sm text-neutral-600">
              {t("surfaceSummary", {
                count: geometry.surfaces.length,
                area: Math.round(totalAreaM2),
              })}
            </p>

            {/* Obstacle toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral-500">{t("obstacles")}:</span>
              <Button
                size="sm"
                variant={armedKind === "window" ? "default" : "outline"}
                onClick={() => setArmedKind(armedKind === "window" ? null : "window")}
              >
                {t("window")}
              </Button>
              <Button
                size="sm"
                variant={armedKind === "chimney" ? "default" : "outline"}
                onClick={() => setArmedKind(armedKind === "chimney" ? null : "chimney")}
              >
                {t("chimney")}
              </Button>
              {selectedObstacleId && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeObstacle(selectedObstacleId)}
                >
                  {t("removeObstacle")}
                </Button>
              )}
            </div>
            <p className="text-xs text-neutral-400">{armedKind ? t("placeHint") : t("dragHint")}</p>

            {/* Custom size for the selected obstacle */}
            {selectedObstacle && (
              <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
                <span className="text-sm font-medium text-neutral-700">
                  {t(selectedObstacle.kind)} — {t("size")}
                </span>
                <SizeRow
                  label={t("widthLabel")}
                  value={selectedObstacle.widthM}
                  onChange={(w) => resizeObstacle(selectedObstacle.id, w, selectedObstacle.heightM)}
                />
                <SizeRow
                  label={t("heightLabel")}
                  value={selectedObstacle.heightM}
                  onChange={(h) => resizeObstacle(selectedObstacle.id, selectedObstacle.widthM, h)}
                />
              </div>
            )}

            <SunControls value={sunTime} onChange={setSunTime} />
          </div>

          <Card className="h-fit">
            <CardContent className="flex flex-col gap-5 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-neutral-500">{t("modules")}</span>
                <span className="text-2xl font-bold">{panelCount}</span>
                <span className="text-sm text-neutral-500">
                  {t("kwp", { kwp: kWp.toFixed(1) })}
                </span>
                <p className="text-xs text-neutral-400">{t("removeHint")}</p>
              </div>

              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant={heatmap ? "default" : "outline"}
                  onClick={() => setHeatmap((h) => !h)}
                >
                  {t("heatmap")}
                </Button>
                {heatmap && yieldQuery.isPending && (
                  <span className="text-xs text-neutral-400">{t("yieldLoading")}</span>
                )}
                {heatmap && yieldQuery.data && (
                  <span className="text-sm text-neutral-600">
                    {t("annualYield", {
                      kwh: Math.round(yieldQuery.data.annual_kwh).toLocaleString("de-DE"),
                    })}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <label htmlFor="panel-density" className="text-neutral-700">
                    {t("density")}
                  </label>
                  <span className="font-mono text-neutral-500">
                    {Math.round(panelDensity * 100)}%
                  </span>
                </div>
                <Slider
                  id="panel-density"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[panelDensity]}
                  onValueChange={([d]) => setPanelDensity(d)}
                />
              </div>

              <div className="flex flex-col gap-2 border-t border-neutral-200 pt-3">
                <span className="text-sm font-medium text-neutral-700">{t("adjustRoof")}</span>
                <RoofParamSliders params={params} onChange={setParam} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {geometry && (
        <Button asChild className="self-start">
          <Link href="/planer/wirtschaft">{t("continueToEconomics")}</Link>
        </Button>
      )}
    </main>
  );
}

function SizeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-600">{label}</span>
        <span className="font-mono text-neutral-500">{value.toFixed(1)} m</span>
      </div>
      <Slider min={0.4} max={3} step={0.1} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
