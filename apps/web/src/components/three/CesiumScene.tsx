"use client";

import "./cesium-config"; // sets CESIUM_BASE_URL — must precede cesium import
import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  createOsmBuildingsAsync,
  Ion,
  Math as CesiumMath,
  Terrain,
  type Viewer as CesiumViewer,
} from "cesium";
import { Entity, Viewer, type CesiumComponentRef } from "resium";
import "cesium/Build/Cesium/Widgets/widgets.css";

export interface CesiumSceneProps {
  lat: number;
  lng: number;
  token: string;
  className?: string;
}

/**
 * Real-world 3D context view (ADR-0008): Cesium ion world terrain + OSM
 * Buildings at the project location. Token-gated; only mounted when a token
 * is present. The schematic editor stays in the R3F view.
 */
export function CesiumScene({ lat, lng, token, className }: CesiumSceneProps) {
  const ref = useRef<CesiumComponentRef<CesiumViewer> | null>(null);

  useEffect(() => {
    Ion.defaultAccessToken = token;
    const viewer = ref.current?.cesiumElement;
    if (!viewer) return;
    let cancelled = false;

    void (async () => {
      try {
        viewer.scene.setTerrain(Terrain.fromWorldTerrain());
      } catch {
        // terrain optional
      }
      try {
        const osm = await createOsmBuildingsAsync();
        if (!cancelled) viewer.scene.primitives.add(osm);
      } catch {
        // OSM buildings optional (needs a valid token)
      }
    })();

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lng, lat - 0.0009, 320),
      orientation: { heading: 0, pitch: CesiumMath.toRadians(-35), roll: 0 },
      duration: 1.2,
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, token]);

  return (
    <div className={className ?? "h-[28rem] w-full overflow-hidden rounded-lg"}>
      <Viewer
        ref={ref}
        full={false}
        style={{ width: "100%", height: "100%" }}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        fullscreenButton={false}
        selectionIndicator={false}
        infoBox={false}
      >
        <Entity
          name="Standort"
          position={Cartesian3.fromDegrees(lng, lat, 0)}
          point={{ pixelSize: 12, color: Color.fromCssColorString("#f59e0b") }}
        />
      </Viewer>
    </div>
  );
}
