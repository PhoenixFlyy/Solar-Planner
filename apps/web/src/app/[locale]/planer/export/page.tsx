"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useLocale, useTranslations } from "next-intl";

import { CURRENT_PROJECT_ID, db, saveProject } from "@/lib/db/db";
import { useRoofStore } from "@/lib/store/roof";
import { getTemplate, type RoofTemplateId } from "@/lib/templates";
import { layoutGeometry, PANEL } from "@/lib/solar/panel-layout";
import { fetchSystemYield } from "@/lib/api/solar";
import { estimateAnnualDemand } from "@/lib/economics/consumption";
import { computeEconomics } from "@/lib/economics/model";
import { serializeProject, parseProject } from "@/lib/export/project";
import { buildShareUrl } from "@/lib/export/share";
import { buildXlsxBlob } from "@/lib/export/xlsx";
import { buildPdfBlob } from "@/lib/export/pdf";
import { saveBlob, savePngDataUrl, saveText } from "@/lib/export/download";
import type { ExportLabels, PlanSummary } from "@/lib/export/summary";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_LOCATION = { lat: 52.52, lng: 13.405 };
const RoofScene = dynamic(() => import("@/components/three/RoofScene").then((m) => m.RoofScene), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-lg bg-neutral-100" />,
});

export default function ExportPage() {
  const t = useTranslations("Export");
  const tNames = useTranslations("RoofTemplates");
  const locale = useLocale();

  const templateId = useRoofStore((s) => s.templateId);
  const params = useRoofStore((s) => s.params);
  const panelDensity = useRoofStore((s) => s.panelDensity);
  const removedPanelIds = useRoofStore((s) => s.removedPanelIds);
  const obstacles = useRoofStore((s) => s.obstacles);
  const hydrate = useRoofStore((s) => s.hydrate);

  const stored = useLiveQuery(() => db.projects.get(CURRENT_PROJECT_ID).then((p) => p ?? null), []);
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current && stored !== undefined) {
      hydrate(stored?.roof ?? null);
      hydrated.current = true;
    }
  }, [stored, hydrate]);

  const loc = stored?.location ?? DEFAULT_LOCATION;
  const captureRef = useRef<(() => string) | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const geometry = useMemo(
    () => (templateId && params ? getTemplate(templateId).buildGeometry(params) : null),
    [templateId, params],
  );
  const placements = useMemo(
    () => (geometry ? layoutGeometry(geometry, { density: panelDensity, obstacles }) : []),
    [geometry, panelDensity, obstacles],
  );
  const kwpBySurface = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of placements) {
      if (!removedPanelIds.has(p.id))
        m.set(p.surfaceId, (m.get(p.surfaceId) ?? 0) + PANEL.ratedWp / 1000);
    }
    return m;
  }, [placements, removedPanelIds]);
  const kWp = [...kwpBySurface.values()].reduce((a, b) => a + b, 0);
  const panelCount = placements.filter((p) => !removedPanelIds.has(p.id)).length;

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
  const yieldQuery = useQuery({
    queryKey: ["yield", loc.lat, loc.lng, JSON.stringify(yieldSurfaces)],
    queryFn: () => fetchSystemYield({ lat: loc.lat, lng: loc.lng, surfaces: yieldSurfaces }),
    enabled: yieldSurfaces.length > 0,
  });

  const economics = useMemo(() => {
    if (!yieldQuery.data || !stored?.economics) return null;
    return computeEconomics({
      annualDemandKwh: estimateAnnualDemand(stored.economics),
      annualProductionKwh: yieldQuery.data.annual_kwh,
      monthlyProductionKwh: yieldQuery.data.monthly_kwh,
      kWp,
      storageKwh: stored.economics.storageKwh,
    });
  }, [yieldQuery.data, stored?.economics, kWp]);

  const summary: PlanSummary = {
    address: stored?.address || "—",
    templateName: templateId ? tNames(templateId as RoofTemplateId) : "—",
    kWp,
    panelCount,
    annualKwh: yieldQuery.data?.annual_kwh ?? 0,
    monthlyKwh: yieldQuery.data?.monthly_kwh ?? Array(12).fill(0),
    economics,
  };

  const labels: ExportLabels = {
    title: t("title"),
    address: t("address"),
    template: t("template"),
    modules: t("modules"),
    annualYield: t("annualYield"),
    autarky: t("autarky"),
    selfConsumption: t("selfConsumption"),
    payback: t("payback"),
    paybackNone: t("paybackNone"),
    annualSavings: t("annualSavings"),
    capex: t("capex"),
    disclaimer: t("disclaimer"),
    overviewSheet: t("overviewSheet"),
    monthlySheet: t("monthlySheet"),
    cashflowSheet: t("cashflowSheet"),
    metric: t("metric"),
    value: t("value"),
    month: t("month"),
    year: t("year"),
    cumulative: t("cumulative"),
  };

  function exportPng() {
    const dataUrl = captureRef.current?.();
    if (dataUrl) savePngDataUrl(dataUrl, "solar-planner.png");
  }
  function exportPdf() {
    const png = captureRef.current?.();
    saveBlob(buildPdfBlob(summary, labels, png), "solar-planner.pdf");
  }
  function exportXlsx() {
    saveBlob(buildXlsxBlob(summary, labels), "solar-planner.xlsx");
  }
  function exportJson() {
    if (stored) saveText(serializeProject(stored), "solar-planner.json");
  }
  async function importJson(file: File) {
    const parsed = parseProject(await file.text());
    if (!parsed) return;
    await saveProject(parsed);
    window.location.reload();
  }
  async function copyShare() {
    if (!stored) return;
    await navigator.clipboard.writeText(buildShareUrl(window.location.origin, locale, stored));
    setShareCopied(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/planer/wirtschaft">{t("back")}</Link>
        </Button>
      </div>

      {geometry && (
        <RoofScene
          geometry={geometry}
          sun={undefined}
          panels={placements}
          removedPanels={removedPanelIds}
          captureRef={captureRef}
          className="h-72 w-full overflow-hidden rounded-lg bg-sky-50"
        />
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Metric label={t("modules")} value={String(panelCount)} />
            <Metric label="kWp" value={kWp.toFixed(1)} />
            <Metric
              label={t("annualYield")}
              value={`${Math.round(summary.annualKwh).toLocaleString("de-DE")} kWh`}
            />
            <Metric
              label={t("payback")}
              value={economics?.paybackYear ? `${economics.paybackYear} a` : "—"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={exportPdf}>PDF</Button>
            <Button onClick={exportXlsx}>XLSX</Button>
            <Button onClick={exportJson}>JSON</Button>
            <Button onClick={exportPng}>PNG</Button>
            <Button variant="outline" onClick={copyShare}>
              {shareCopied ? t("shareCopied") : t("share")}
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100">
              {t("importJson")}
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importJson(f);
                }}
              />
            </label>
          </div>

          <p className="text-xs text-neutral-400">{t("disclaimer")}</p>
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
