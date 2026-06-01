"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { ROOF_TEMPLATES, type RoofTemplateId } from "@/lib/templates";
import { cn } from "@/lib/utils";

export interface TemplatePickerProps {
  selectedId: RoofTemplateId | null;
  onSelect: (id: RoofTemplateId) => void;
}

export function TemplatePicker({ selectedId, onSelect }: TemplatePickerProps) {
  const t = useTranslations("RoofTemplates");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ROOF_TEMPLATES.map((tpl) => {
        const active = tpl.id === selectedId;
        return (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl.id)}
            aria-pressed={active}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition-colors",
              active
                ? "border-amber-500 ring-2 ring-amber-500"
                : "border-neutral-200 hover:border-neutral-300",
            )}
          >
            <Image
              src={tpl.previewImage}
              alt={t(tpl.nameKey)}
              width={120}
              height={90}
              className="h-auto w-full"
            />
            <span className="text-sm font-medium">{t(tpl.nameKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
