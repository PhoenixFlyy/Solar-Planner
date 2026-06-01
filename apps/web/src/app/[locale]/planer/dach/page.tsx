"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";

import { CURRENT_PROJECT_ID, db, saveProject } from "@/lib/db/db";
import { useRoofStore } from "@/lib/store/roof";
import { applyDimensions, footprintDimensions, getTemplate } from "@/lib/templates";
import { Link } from "@/i18n/navigation";
import { TemplatePicker } from "@/components/planner/TemplatePicker";
import { RoofParamSliders } from "@/components/planner/RoofParamSliders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const hydrate = useRoofStore((s) => s.hydrate);

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
      void saveProject({ roof: { templateId, params } });
    }
  }, [templateId, params]);

  const geometry = useMemo(
    () => (templateId && params ? getTemplate(templateId).buildGeometry(params) : null),
    [templateId, params],
  );

  const totalAreaM2 = geometry ? geometry.surfaces.reduce((a, s) => a + s.areaM2, 0) : 0;

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
          <div className="flex flex-col gap-2">
            <RoofScene
              geometry={geometry}
              selectedSurfaceId={selectedSurfaceId}
              onSelectSurface={selectSurface}
            />
            <p className="text-sm text-neutral-600">
              {t("surfaceSummary", {
                count: geometry.surfaces.length,
                area: Math.round(totalAreaM2),
              })}
            </p>
          </div>

          <Card className="h-fit">
            <CardContent className="p-4">
              <RoofParamSliders params={params} onChange={setParam} />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
