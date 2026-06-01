"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";

import { CURRENT_PROJECT_ID, db, saveProject, type EconomicsConfig } from "@/lib/db/db";
import { useRoofStore } from "@/lib/store/roof";
import { getTemplate } from "@/lib/templates";
import { layoutGeometry, PANEL } from "@/lib/solar/panel-layout";
import { fetchSystemYield } from "@/lib/api/solar";
import { demandComponents, estimateAnnualDemand } from "@/lib/economics/consumption";
import { computeEconomics } from "@/lib/economics/model";
import { simulateYear } from "@/lib/simulation/simulate";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { MonthlyProductionChart } from "@/components/charts/MonthlyProductionChart";
import { EnergySplitChart } from "@/components/charts/EnergySplitChart";

const DEFAULT_LOCATION = { lat: 52.52, lng: 13.405 };
const DEFAULT_ECON: EconomicsConfig = { persons: 3, eCar: false, heatPump: false, storageKwh: 6 };

const eur = (n: number) => `${Math.round(n).toLocaleString("de-DE")} €`;
const pct = (n: number) => `${Math.round(n * 100)} %`;

export default function WirtschaftPage() {
  const t = useTranslations("Wirtschaft");

  const templateId = useRoofStore((s) => s.templateId);
  const params = useRoofStore((s) => s.params);
  const panelDensity = useRoofStore((s) => s.panelDensity);
  const removedPanelIds = useRoofStore((s) => s.removedPanelIds);
  const obstacles = useRoofStore((s) => s.obstacles);
  const hydrate = useRoofStore((s) => s.hydrate);

  const stored = useLiveQuery(() => db.projects.get(CURRENT_PROJECT_ID).then((p) => p ?? null), []);

  const roofHydrated = useRef(false);
  useEffect(() => {
    if (!roofHydrated.current && stored !== undefined) {
      hydrate(stored?.roof ?? null);
      roofHydrated.current = true;
    }
  }, [stored, hydrate]);

  // Economics inputs (persons/EV/heat-pump/storage), hydrated once + persisted.
  const [econ, setEcon] = useState<EconomicsConfig>(DEFAULT_ECON);
  const econHydrated = useRef(false);
  useEffect(() => {
    if (!econHydrated.current && stored !== undefined) {
      setEcon(stored?.economics ?? DEFAULT_ECON);
      econHydrated.current = true;
    }
  }, [stored]);
  useEffect(() => {
    if (econHydrated.current) void saveProject({ economics: econ });
  }, [econ]);

  const loc = stored?.location ?? DEFAULT_LOCATION;

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

  const demandKwh = estimateAnnualDemand(econ);

  // Hourly simulation drives self-consumption / autarky (Phase 2).
  const sim = useMemo(() => {
    if (!yieldQuery.data) return null;
    return simulateYear({
      monthlyPvKwh: yieldQuery.data.monthly_kwh,
      demand: demandComponents(econ),
      storageKwh: econ.storageKwh,
      lat: loc.lat,
      lng: loc.lng,
    });
  }, [yieldQuery.data, econ, loc.lat, loc.lng]);

  const economics = useMemo(() => {
    if (!yieldQuery.data) return null;
    return computeEconomics({
      annualDemandKwh: demandKwh,
      annualProductionKwh: yieldQuery.data.annual_kwh,
      monthlyProductionKwh: yieldQuery.data.monthly_kwh,
      kWp,
      storageKwh: econ.storageKwh,
      selfConsumptionOverrideKwh: sim?.selfConsumptionKwh,
    });
  }, [yieldQuery.data, demandKwh, kWp, econ.storageKwh, sim]);

  if (roofHydrated.current && !templateId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-neutral-600">{t("configureRoofFirst")}</p>
        <Button asChild>
          <Link href="/planer/dach">{t("toRoof")}</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/planer/dach">{t("back")}</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Inputs */}
        <Card className="h-fit">
          <CardContent className="flex flex-col gap-5 p-4">
            <SliderRow
              label={t("persons", { n: econ.persons })}
              min={1}
              max={6}
              step={1}
              value={econ.persons}
              onChange={(persons) => setEcon((e) => ({ ...e, persons }))}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={econ.eCar ? "default" : "outline"}
                onClick={() => setEcon((e) => ({ ...e, eCar: !e.eCar }))}
              >
                {t("eCar")}
              </Button>
              <Button
                size="sm"
                variant={econ.heatPump ? "default" : "outline"}
                onClick={() => setEcon((e) => ({ ...e, heatPump: !e.heatPump }))}
              >
                {t("heatPump")}
              </Button>
            </div>
            <SliderRow
              label={t("storage", { kwh: econ.storageKwh })}
              min={0}
              max={20}
              step={0.5}
              value={econ.storageKwh}
              onChange={(storageKwh) => setEcon((e) => ({ ...e, storageKwh }))}
            />
            <dl className="flex flex-col gap-1 text-sm">
              <Row label={t("demand")} value={`${demandKwh.toLocaleString("de-DE")} kWh`} />
              <Row label={t("system")} value={`${kWp.toFixed(1)} kWp`} />
            </dl>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="flex flex-col gap-5">
          {yieldQuery.isPending && yieldSurfaces.length > 0 && (
            <p className="text-sm text-neutral-500">{t("loading")}</p>
          )}
          {yieldSurfaces.length === 0 && (
            <p className="text-sm text-neutral-500">{t("noPanels")}</p>
          )}

          {economics && yieldQuery.data && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label={t("autarky")} value={pct(economics.autarky)} />
                <Metric label={t("selfConsumption")} value={pct(economics.selfConsumptionRate)} />
                <Metric
                  label={t("payback")}
                  value={
                    economics.paybackYear
                      ? t("years", { n: economics.paybackYear })
                      : t("paybackNone")
                  }
                />
                <Metric label={t("annualSavings")} value={eur(economics.annualSavingsEur)} />
              </div>

              <Card>
                <CardContent className="p-4">
                  <h2 className="mb-2 text-sm font-medium text-neutral-700">{t("cashflow")}</h2>
                  <CashflowChart
                    cashflow={economics.cashflow}
                    paybackYear={economics.paybackYear}
                  />
                  <p className="mt-1 text-xs text-neutral-400">
                    {t("capex", { v: eur(economics.capexEur) })}
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <h2 className="mb-2 text-sm font-medium text-neutral-700">
                      {t("monthlyProduction")}
                    </h2>
                    <MonthlyProductionChart monthlyKwh={yieldQuery.data.monthly_kwh} />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="mb-2 text-sm font-medium text-neutral-700">
                      {t("productionSplit")}
                    </h2>
                    <EnergySplitChart
                      selfConsumptionKwh={economics.selfConsumptionKwh}
                      feedInKwh={economics.feedInKwh}
                      labels={{
                        selfConsumption: t("selfConsumptionLabel"),
                        feedIn: t("feedInLabel"),
                      }}
                    />
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-neutral-400">{t("disclaimer")}</p>

              <Button asChild className="self-start">
                <Link href="/planer/export">{t("continueToExport")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-neutral-700">{label}</label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
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
