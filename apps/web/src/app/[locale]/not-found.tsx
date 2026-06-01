import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("Common");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-neutral-500">{t("appName")}</p>
      <Button asChild variant="outline">
        <Link href="/">←</Link>
      </Button>
    </main>
  );
}
