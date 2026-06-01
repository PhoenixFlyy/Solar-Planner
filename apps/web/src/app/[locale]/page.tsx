import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  const tc = await getTranslations("Common");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
        <p className="text-pretty text-lg text-neutral-600 dark:text-neutral-300">
          {t("subtitle")}
        </p>
      </div>

      <Button asChild size="lg">
        <Link href="/planer">{t("cta")}</Link>
      </Button>

      <p className="text-sm text-neutral-500">{t("noLogin")}</p>

      <footer className="mt-16 max-w-prose text-xs text-neutral-400">{tc("disclaimer")}</footer>
    </main>
  );
}
