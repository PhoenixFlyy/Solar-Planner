import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";

// NOTE: Placeholder legal page. The maintainer must fill in real provider
// details (§ 5 DDG / § 18 MStV) and have the text reviewed before launch.
export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Impressum");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-sm text-neutral-600">{t("intro")}</p>

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">{t("providerHeading")}</h2>
        <p className="whitespace-pre-line text-sm text-neutral-600">{t("providerPlaceholder")}</p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="font-semibold">{t("contactHeading")}</h2>
        <p className="whitespace-pre-line text-sm text-neutral-600">{t("contactPlaceholder")}</p>
      </section>

      <p className="text-xs text-amber-700">{t("todo")}</p>

      <Link href="/" className="text-sm underline">
        ←
      </Link>
    </main>
  );
}
