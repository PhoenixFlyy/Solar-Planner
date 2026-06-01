"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

// MVP uses no tracking cookies and no analytics; data lives in IndexedDB on
// the device. This is an informational notice + acknowledgement. The consent
// flag is a trivial UI pref → localStorage is allowed here (CLAUDE.md).
const KEY = "sp-consent-v1";

export function ConsentBanner() {
  const t = useTranslations("Consent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      // private mode / storage disabled — just don't show
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-neutral-600">
          {t("text")}{" "}
          <Link href="/datenschutz" className="underline">
            {t("more")}
          </Link>
        </p>
        <Button
          size="sm"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              // ignore
            }
            setVisible(false);
          }}
        >
          {t("accept")}
        </Button>
      </div>
    </div>
  );
}
