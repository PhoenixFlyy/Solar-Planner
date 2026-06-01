"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export interface SunTime {
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-24 (local, CET approx)
}

// Solstices / equinoxes at solar noon.
const SEASONS: { key: string; month: number; day: number }[] = [
  { key: "spring", month: 3, day: 20 },
  { key: "summer", month: 6, day: 21 },
  { key: "autumn", month: 9, day: 23 },
  { key: "winter", month: 12, day: 21 },
];

export interface SunControlsProps {
  value: SunTime;
  onChange: (value: SunTime) => void;
}

export function SunControls({ value, onChange }: SunControlsProps) {
  const t = useTranslations("Sun");
  const activeSeason = SEASONS.find((s) => s.month === value.month && s.day === value.day)?.key;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {SEASONS.map((s) => (
          <Button
            key={s.key}
            type="button"
            size="sm"
            variant={activeSeason === s.key ? "default" : "outline"}
            onClick={() => onChange({ ...value, month: s.month, day: s.day })}
          >
            {t(s.key)}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="sun-hour" className="text-neutral-700">
            {t("time")}
          </label>
          <span className="font-mono text-neutral-500">{formatHour(value.hour)}</span>
        </div>
        <Slider
          id="sun-hour"
          min={4}
          max={22}
          step={0.25}
          value={[value.hour]}
          onValueChange={([h]) => onChange({ ...value, hour: h })}
        />
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
