import { defineRouting } from "next-intl/routing";

// German is the default locale; English is available. EU-expandable (PROJECT.md).
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
});

export type Locale = (typeof routing.locales)[number];
