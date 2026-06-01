"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { saveProject } from "@/lib/db/db";
import { decodeShare } from "@/lib/export/share";
import type { ProjectExport } from "@/lib/export/project";
import { getTemplate, type RoofTemplateId } from "@/lib/templates";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SharePage() {
  const t = useTranslations("Share");
  const tNames = useTranslations("RoofTemplates");
  const router = useRouter();

  const [shared, setShared] = useState<ProjectExport["project"] | null | undefined>(undefined);

  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "");
    setShared(fragment ? decodeShare(fragment) : null);
  }, []);

  async function loadIntoPlanner() {
    if (!shared) return;
    await saveProject(shared);
    router.push("/planer/dach");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {shared === undefined && <p className="text-neutral-500">…</p>}
      {shared === null && <p className="text-neutral-500">{t("invalid")}</p>}

      {shared && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="text-sm">
              <span className="text-neutral-500">{t("address")}: </span>
              <span className="font-medium">{shared.address || "—"}</span>
            </div>
            {shared.roof && (
              <div className="text-sm">
                <span className="text-neutral-500">{t("template")}: </span>
                <span className="font-medium">
                  {tNames(getTemplate(shared.roof.templateId as RoofTemplateId).nameKey)}
                </span>
              </div>
            )}
            <Button className="self-start" onClick={loadIntoPlanner}>
              {t("load")}
            </Button>
            <p className="text-xs text-neutral-400">{t("readOnly")}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
