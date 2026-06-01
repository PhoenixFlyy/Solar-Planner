"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";

import { CURRENT_PROJECT_ID, db } from "@/lib/db/db";
import { fetchSystemYield } from "@/lib/api/solar";
import { computeEconomics } from "@/lib/economics/model";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const DEFAULT_LOCATION = { lat: 52.52, lng: 13.405 };

/** Mobile quick-calc: no 3D, just a few sliders → yield + payback (Phase 2). */
export default function SchnellrechnerPage() {
  const t = useTranslations("Schnellrechner");
  const stored = useLiveQuery(() => db.projects.get(CURRENT_PROJECT_ID).then((p) => p ?? null), []);
  const loc = stored?.location ?? DEFAULT_LOCATION;

  const [kWp, setKWp] = useState(6);
  const [azimuth, setAzimuth] = useState(180);
  const [tilt, setTilt] = useState(30);
  const [demandKwh, setDemandKwh] = useState(3500);

  const surfaces = useMemo(() => [{ id: "quick", tilt, azimuth, kwp: kWp }], [tilt, azimuth, kWp]);
  const yieldQuery = useQuery({
    queryKey: ["yield", loc.lat, loc.lng, JSON.stringify(surfaces)],
    queryFn: () => fetchSystemYield({ lat: loc.lat, lng: loc.lng, surfaces }),
    enabled: kWp > 0,
  });

  const economics = useMemo(() => {
    if (!yieldQuery.data) return null;
    return computeEconomics({
      annualDemandKwh: demandKwh,
      annualProductionKwh: yieldQuery.data.annual_kwh,
      monthlyProductionKwh: yieldQuery.data.monthly_kwh,
      kWp,
      storageKwh: 0,
    });
  }, [yieldQuery.data, demandKwh, kWp]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 px-5 py-10">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-4">
          <Row
            label={t("kwp", { v: kWp })}
            min={1}
            max={20}
            step={0.5}
            value={kWp}
            onChange={setKWp}
          />
          <Row
            label={t("azimuth", { v: azimuth })}
            min={0}
            max={360}
            step={5}
            value={azimuth}
            onChange={setAzimuth}
          />
          <Row
            label={t("tilt", { v: tilt })}
            min={0}
            max={60}
            step={1}
            value={tilt}
            onChange={setTilt}
          />
          <Row
            label={t("demand", { v: demandKwh.toLocaleString("de-DE") })}
            min={1500}
            max={9000}
            step={100}
            value={demandKwh}
            onChange={setDemandKwh}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Metric
          label={t("annualYield")}
          value={
            yieldQuery.data
              ? `${Math.round(yieldQuery.data.annual_kwh).toLocaleString("de-DE")} kWh`
              : "…"
          }
        />
        <Metric
          label={t("payback")}
          value={economics?.paybackYear ? t("years", { n: economics.paybackYear }) : "…"}
        />
        <Metric
          label={t("savings")}
          value={
            economics ? `${Math.round(economics.annualSavingsEur).toLocaleString("de-DE")} €` : "…"
          }
        />
        <Metric label="kWp" value={kWp.toFixed(1)} />
      </div>

      <p className="text-xs text-neutral-400">{t("disclaimer")}</p>

      <Button asChild variant="outline" className="self-start">
        <Link href="/planer">{t("toFull")}</Link>
      </Button>
    </main>
  );
}

function Row({
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
