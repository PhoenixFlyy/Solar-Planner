"use client";

import { useTranslations } from "next-intl";

import type { RoofParams } from "@/lib/templates";
import { Slider } from "@/components/ui/slider";

interface Range {
  min: number;
  max: number;
  step: number;
  unit: string;
}

// Sensible editing ranges per parameter key (meters, except azimuth degrees).
const RANGES: Record<string, Range> = {
  spanM: { min: 4, max: 16, step: 0.5, unit: "m" },
  lengthM: { min: 4, max: 20, step: 0.5, unit: "m" },
  widthM: { min: 4, max: 16, step: 0.5, unit: "m" },
  eaveHeightM: { min: 2, max: 10, step: 0.25, unit: "m" },
  ridgeHeightM: { min: 3, max: 14, step: 0.25, unit: "m" },
  lowEaveHeightM: { min: 2, max: 8, step: 0.25, unit: "m" },
  highEaveHeightM: { min: 3, max: 12, step: 0.25, unit: "m" },
  hipInsetM: { min: 0, max: 6, step: 0.25, unit: "m" },
  roofHeightM: { min: 2, max: 12, step: 0.25, unit: "m" },
  parapetHeightM: { min: 0, max: 1.5, step: 0.05, unit: "m" },
  azimuthDeg: { min: 0, max: 360, step: 5, unit: "°" },
};

export interface RoofParamSlidersProps {
  params: RoofParams;
  onChange: (key: string, value: number) => void;
}

export function RoofParamSliders({ params, onChange }: RoofParamSlidersProps) {
  const t = useTranslations("RoofParams");

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(params).map(([key, value]) => {
        const range = RANGES[key];
        if (!range || typeof value !== "number") return null;
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <label htmlFor={`param-${key}`} className="text-neutral-700">
                {t(key)}
              </label>
              <span className="font-mono text-neutral-500">
                {value}
                {range.unit}
              </span>
            </div>
            <Slider
              id={`param-${key}`}
              min={range.min}
              max={range.max}
              step={range.step}
              value={[value]}
              onValueChange={([v]) => onChange(key, v)}
            />
          </div>
        );
      })}
    </div>
  );
}
