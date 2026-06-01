import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/** Global footer: disclaimer + legal links, visible on every page. */
export function SiteFooter() {
  const t = useTranslations("Footer");
  return (
    <footer className="mt-12 border-t border-neutral-200 px-6 py-6 text-xs text-neutral-400">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-prose">{t("disclaimer")}</p>
        <nav className="flex gap-4">
          <Link href="/impressum" className="hover:text-neutral-600">
            {t("impressum")}
          </Link>
          <Link href="/datenschutz" className="hover:text-neutral-600">
            {t("datenschutz")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
