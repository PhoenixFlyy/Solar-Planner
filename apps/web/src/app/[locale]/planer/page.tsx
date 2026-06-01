"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslations } from "next-intl";

import { fetchFootprint, geocode, type GeocodeResult } from "@/lib/api/geo";
import { CURRENT_PROJECT_ID, db, saveProject } from "@/lib/db/db";
import { FootprintMap } from "@/components/map/FootprintMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function PlanerPage() {
  const t = useTranslations("Planer");
  const stored = useLiveQuery(() => db.projects.get(CURRENT_PROJECT_ID), []);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const prefilled = useRef(false);

  // Restore the last address into the input once Dexie has loaded.
  useEffect(() => {
    if (!prefilled.current && stored?.address) {
      setQuery(stored.address);
      prefilled.current = true;
    }
  }, [stored]);

  const search = useMutation({
    mutationFn: (q: string) => geocode(q),
    onSuccess: (data) => setResults(data.results),
  });

  async function selectResult(r: GeocodeResult) {
    setResults([]);
    let footprintPoints: { lat: number; lng: number }[] | null = null;
    try {
      const fp = await fetchFootprint(r.lat, r.lng);
      footprintPoints = fp.footprint?.points ?? null;
    } catch {
      footprintPoints = null; // degrade gracefully (Overpass may be down)
    }
    await saveProject({
      address: r.label,
      location: { label: r.label, lat: r.lat, lng: r.lng },
      footprint: footprintPoints ? { points: footprintPoints } : null,
    });
    setQuery(r.label);
  }

  const location = stored?.location ?? null;
  const footprint = stored?.footprint?.points ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length >= 2) search.mutate(query.trim());
        }}
      >
        <Input
          aria-label={t("addressLabel")}
          placeholder={t("addressPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={search.isPending}>
          {search.isPending ? t("searching") : t("search")}
        </Button>
      </form>

      {results.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-1 p-2">
            {results.map((r, i) => (
              <button
                key={`${r.lat},${r.lng},${i}`}
                type="button"
                onClick={() => selectResult(r)}
                className="rounded-md px-3 py-2 text-left text-sm hover:bg-neutral-100"
              >
                {r.label}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {search.isSuccess && results.length === 0 && !location && (
        <p className="text-sm text-neutral-500">{t("noResults")}</p>
      )}

      {location && (
        <section className="flex flex-col gap-2" data-testid="planer-result">
          {stored?.address && prefilled.current && (
            <p className="text-xs text-neutral-400">{t("restored")}</p>
          )}
          <FootprintMap center={{ lat: location.lat, lng: location.lng }} footprint={footprint} />
          <p className="text-sm text-neutral-600">
            {footprint ? t("footprintFound") : t("footprintMissing")}
          </p>
        </section>
      )}
    </main>
  );
}
