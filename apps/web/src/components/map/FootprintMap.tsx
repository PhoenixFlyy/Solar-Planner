"use client";

import { useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import type { StoredLatLng } from "@/lib/db/db";

// Free OSM raster basemap — no API key. (Heavy production traffic should use
// a dedicated tile host; fine for local/dev per ADR-0006.)
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export interface FootprintMapProps {
  center: { lat: number; lng: number };
  footprint: StoredLatLng[] | null;
}

const FOOTPRINT_SOURCE = "footprint";

export function FootprintMap({ center, footprint }: FootprintMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Init the map once (dynamic import keeps maplibre out of SSR).
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;
      map = new maplibre.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center: [center.lng, center.lat],
        zoom: 18,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  // React to center / footprint changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      map.setCenter([center.lng, center.lat]);

      const data: GeoJSON.Feature<GeoJSON.Polygon> | null = footprint
        ? {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [footprint.map((p) => [p.lng, p.lat])],
            },
          }
        : null;

      const existing = map.getSource<GeoJSONSource>(FOOTPRINT_SOURCE);
      if (data && !existing) {
        map.addSource(FOOTPRINT_SOURCE, { type: "geojson", data });
        map.addLayer({
          id: "footprint-fill",
          type: "fill",
          source: FOOTPRINT_SOURCE,
          paint: { "fill-color": "#f59e0b", "fill-opacity": 0.35 },
        });
        map.addLayer({
          id: "footprint-line",
          type: "line",
          source: FOOTPRINT_SOURCE,
          paint: { "line-color": "#b45309", "line-width": 2 },
        });
      } else if (data && existing) {
        existing.setData(data);
      }
    };

    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [center, footprint]);

  return <div ref={containerRef} className="h-80 w-full rounded-lg" data-testid="footprint-map" />;
}
