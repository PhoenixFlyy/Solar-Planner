"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";

import { CURRENT_PROJECT_ID, db, saveProject } from "@/lib/db/db";
import { useRoofStore } from "@/lib/store/roof";
import { applyDimensions, footprintDimensions, getTemplate } from "@/lib/templates";
import { sunPosition } from "@/lib/solar/sun-position";
import { kWpFor, layoutGeometry } from "@/lib/solar/panel-layout";
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
  const hydrate = useRoofStore((s) => s.hydrate);
  const toConfig = useRoofStore((s) => s.toConfig);

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
  }, [templateId, params, panelDensity, removedPanelIds, toConfig]);

  const geometry = useMemo(
    () => (templateId && params ? getTemplate(templateId).buildGeometry(params) : null),
    [templateId, params],
  );

  const totalAreaM2 = geometry ? geometry.surfaces.reduce((a, s) => a + s.areaM2, 0) : 0;

  // Auto-layout panels; count excludes manually-removed ones.
  const placements = useMemo(
    () => (geometry ? layoutGeometry(geometry, { density: panelDensity }) : []),
    [geometry, panelDensity],
  );
  const panelCount = placements.filter((p) => !removedPanelIds.has(p.id)).length;
  const kWp = kWpFor(panelCount);

  // Sun / time-of-year for the live light + shadows.
  const [sunTime, setSunTime] = useState<SunTime>({ month: 6, day: 21, hour: 12 });
  const loc = stored?.location ?? DEFAULT_LOCATION;
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
            <RoofScene
              geometry={geometry}
              selectedSurfaceId={selectedSurfaceId}
              onSelectSurface={selectSurface}
              sun={sun}
              panels={placements}
              removedPanels={removedPanelIds}
              onTogglePanel={togglePanel}
            />
            <p className="text-sm text-neutral-600">
              {t("surfaceSummary", {
                count: geometry.surfaces.length,
                area: Math.round(totalAreaM2),
              })}
            </p>
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

              <RoofParamSliders params={params} onChange={setParam} />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
