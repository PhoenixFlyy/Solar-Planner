import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

// NOTE: Placeholder privacy page describing the MVP's actual data handling
// (local-first, no tracking). Must be reviewed/extended by the maintainer
// (and updated when Supabase/analytics are enabled) before launch.
export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Datenschutz");

  const sections = ["local", "external", "analytics", "rights"] as const;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-neutral-600">{t("intro")}</p>

      {sections.map((s) => (
        <section key={s} className="flex flex-col gap-1">
          <h2 className="font-semibold">{t(`${s}Heading`)}</h2>
          <p className="whitespace-pre-line text-sm text-neutral-600">{t(`${s}Text`)}</p>
        </section>
      ))}

      <p className="text-xs text-amber-700">{t("todo")}</p>

      <Link href="/" className="text-sm underline">
        ←
      </Link>
    </main>
  );
}
