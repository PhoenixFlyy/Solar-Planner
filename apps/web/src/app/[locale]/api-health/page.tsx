"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { getHealth } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ApiHealthPage() {
  const t = useTranslations("ApiHealth");
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending && <p className="text-neutral-500">{t("checking")}</p>}
          {isError && <p className="font-medium text-red-600">{t("error")}</p>}
          {data && (
            <dl className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <span className="font-medium text-green-700">{t("ok")}</span>
              </div>
              <div>
                <dt className="inline text-neutral-500">{t("service")}: </dt>
                <dd className="inline font-mono">{data.service}</dd>
              </div>
              <div>
                <dt className="inline text-neutral-500">{t("version")}: </dt>
                <dd className="inline font-mono">{data.version}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
