"use client";

import "./cesium-config"; // sets CESIUM_BASE_URL — must precede cesium import
import { useEffect, useRef } from "react";
import {
  Cartographic,
  Color,
  JulianDate,
  PolygonHierarchy,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
  Ion,
  Math as CesiumMath,
  Cartesian2,
  CustomDataSource,
  HeadingPitchRange,
  BoundingSphere,
  createOsmBuildingsAsync,
  createWorldTerrainAsync,
  defined,
  sampleTerrainMostDetailed,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

import type { RoofGeometry, Vec3 } from "@/lib/templates";
import {
  panelCorners,
  surfaceBasis,
  surfaceUVToWorld,
  projectToSurfaceUV,
  type Obstacle,
  type PanelPlacement,
} from "@/lib/solar/panel-layout";
import { localPolygon, siteFrame, cartesianToLocal, type SiteFrame } from "@/lib/cesium/transform";

const COLORS = {
  wall: Color.fromCssColorString("#e7e5e4"),
  roof: Color.fromCssColorString("#9a3412"),
  roofSelected: Color.fromCssColorString("#f59e0b"),
  panel: Color.fromCssColorString("#1e3a8a"),
  window: Color.fromCssColorString("#7dd3fc"),
  chimney: Color.fromCssColorString("#78716c"),
  obstacleSelected: Color.fromCssColorString("#f59e0b"),
};
const CHIMNEY_H = 1.2;
const snap = (n: number) => Math.round(n / 0.5) * 0.5;

export interface CesiumEditorProps {
  geometry: RoofGeometry;
  lat: number;
  lng: number;
  token: string;
  sunTimeUtc: Date;
  panels: PanelPlacement[];
  removedPanels: Set<string>;
  obstacles: Obstacle[];
  selectedSurfaceId?: string | null;
  selectedObstacleId?: string | null;
  armed: boolean;
  panelColorFor?: (p: PanelPlacement) => string;
  onSelectSurface: (id: string) => void;
  onTogglePanel: (id: string) => void;
  onSelectObstacle: (id: string | null) => void;
  onPlaceObstacleAt: (surfaceId: string, u: number, v: number) => void;
  onMoveObstacleTo: (id: string, u: number, v: number) => void;
  className?: string;
}

export function CesiumEditor(props: CesiumEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const dsRef = useRef<CustomDataSource | null>(null);
  const frameRef = useRef<SiteFrame | null>(null);
  // Latest props for the imperative event handler.
  const p = useRef(props);
  p.current = props;

  // Create the viewer once (per token).
  useEffect(() => {
    Ion.defaultAccessToken = props.token;
    if (!containerRef.current) return;
    const viewer = new Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      shadows: true,
    });
    viewerRef.current = viewer;
    viewer.scene.globe.enableLighting = true;
    const ds = new CustomDataSource("house");
    void viewer.dataSources.add(ds);
    dsRef.current = ds;

    let cancelled = false;
    void (async () => {
      try {
        const terrain = await createWorldTerrainAsync();
        if (cancelled) return;
        viewer.terrainProvider = terrain;
      } catch {
        /* terrain optional */
      }
      try {
        const osm = await createOsmBuildingsAsync();
        if (!cancelled) viewer.scene.primitives.add(osm);
      } catch {
        /* OSM buildings optional */
      }
    })();

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    let dragId: string | null = null;

    const idOf = (picked: unknown): string | null => {
      const obj = picked as { id?: { id?: string } } | undefined;
      return obj?.id && typeof obj.id.id === "string" ? obj.id.id : null;
    };
    const localAt = (winPos: Cartesian2): Vec3 | null => {
      const frame = frameRef.current;
      if (!frame) return null;
      const cart = viewer.scene.pickPosition(winPos);
      return defined(cart) ? cartesianToLocal(frame, cart) : null;
    };
    const surfaceUV = (surfaceId: string, local: Vec3) => {
      const surf = p.current.geometry.surfaces.find((s) => s.id === surfaceId);
      if (!surf) return null;
      const { u, v } = projectToSurfaceUV(surfaceBasis(surf.polygon), local);
      return { u: snap(u), v: snap(v) };
    };

    handler.setInputAction((click: { position: Cartesian2 }) => {
      const id = idOf(viewer.scene.pick(click.position));
      if (!id) {
        p.current.onSelectObstacle(null);
        return;
      }
      const kind = id.split(":")[0];
      const rest = id.slice(kind.length + 1);
      if (kind === "panel") p.current.onTogglePanel(rest);
      else if (kind === "obstacle") p.current.onSelectObstacle(rest.split("#")[0]);
      else if (kind === "surface") {
        if (p.current.armed) {
          const local = localAt(click.position);
          const uv = local && surfaceUV(rest, local);
          if (uv) p.current.onPlaceObstacleAt(rest, uv.u, uv.v);
        } else {
          p.current.onSelectSurface(rest);
        }
      } else {
        p.current.onSelectObstacle(null);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction((down: { position: Cartesian2 }) => {
      const id = idOf(viewer.scene.pick(down.position));
      if (id && id.startsWith("obstacle:")) {
        dragId = id.slice("obstacle:".length).split("#")[0];
        viewer.scene.screenSpaceCameraController.enableInputs = false;
      }
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((move: { endPosition: Cartesian2 }) => {
      if (!dragId) return;
      const ob = p.current.obstacles.find((o) => o.id === dragId);
      if (!ob) return;
      const local = localAt(move.endPosition);
      const uv = local && surfaceUV(ob.surfaceId, local);
      if (uv) p.current.onMoveObstacleTo(dragId, uv.u, uv.v);
    }, ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(() => {
      if (dragId) {
        dragId = null;
        viewer.scene.screenSpaceCameraController.enableInputs = true;
      }
    }, ScreenSpaceEventType.LEFT_UP);

    return () => {
      cancelled = true;
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, [props.token]);

  // Anchor the site frame on the terrain height (rebuilds the house there).
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    let cancelled = false;
    void (async () => {
      let height = 0;
      try {
        const [s] = await sampleTerrainMostDetailed(viewer.terrainProvider, [
          Cartographic.fromDegrees(props.lng, props.lat),
        ]);
        if (defined(s?.height)) height = s.height;
      } catch {
        /* default 0 */
      }
      if (cancelled) return;
      frameRef.current = siteFrame(props.lat, props.lng, height);
      buildEntities();
      const origin = frameRef.current.origin;
      const reach = Math.max(props.geometry.footprintWidthM, props.geometry.footprintDepthM);
      viewer.camera.flyToBoundingSphere(new BoundingSphere(origin, reach * 2.2), {
        offset: new HeadingPitchRange(
          CesiumMath.toRadians(30),
          CesiumMath.toRadians(-30),
          reach * 3,
        ),
        duration: 1.2,
      });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.lat, props.lng]);

  // Rebuild the house whenever the model or selection changes.
  useEffect(() => {
    buildEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.geometry,
    props.panels,
    props.removedPanels,
    props.obstacles,
    props.selectedSurfaceId,
    props.selectedObstacleId,
    props.panelColorFor,
  ]);

  // Drive Cesium's real sun (→ realistic shadows) from the chosen time.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (viewer) viewer.clock.currentTime = JulianDate.fromDate(props.sunTimeUtc);
  }, [props.sunTimeUtc]);

  function buildEntities() {
    const viewer = viewerRef.current;
    const ds = dsRef.current;
    const frame = frameRef.current;
    if (!viewer || !ds || !frame) return;
    ds.entities.removeAll();

    const poly = (id: string, ring: Vec3[], color: Color) =>
      ds.entities.add({
        id,
        polygon: {
          hierarchy: new PolygonHierarchy(localPolygon(frame, ring)),
          perPositionHeight: true,
          material: color,
        },
      });

    const g = props.geometry;
    // Walls: vertical quad per footprint edge (ground → eave).
    const ring = g.groundPolygon;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      poly(
        `house:wall:${i}`,
        [
          [a[0], 0, a[2]],
          [b[0], 0, b[2]],
          [b[0], g.eaveHeightM, b[2]],
          [a[0], g.eaveHeightM, a[2]],
        ],
        COLORS.wall,
      );
    }
    g.gableFaces.forEach((face, i) => poly(`house:gable:${i}`, face, COLORS.wall));
    for (const s of g.surfaces) {
      poly(
        `surface:${s.id}`,
        s.polygon,
        s.id === props.selectedSurfaceId ? COLORS.roofSelected : COLORS.roof,
      );
    }

    // Panels (skip removed).
    for (const panel of props.panels) {
      if (props.removedPanels.has(panel.id)) continue;
      const color = props.panelColorFor
        ? Color.fromCssColorString(props.panelColorFor(panel))
        : COLORS.panel;
      poly(`panel:${panel.id}`, panelCorners(panel), color);
    }

    // Obstacles.
    for (const ob of props.obstacles) {
      const surf = g.surfaces.find((s) => s.id === ob.surfaceId);
      if (!surf) continue;
      const basis = surfaceBasis(surf.polygon);
      const selected = ob.id === props.selectedObstacleId;
      const hw = ob.widthM / 2;
      const hh = ob.heightM / 2;
      const corner = (su: number, sv: number) =>
        surfaceUVToWorld(basis, ob.u + su * hw, ob.v + sv * hh);
      const base: Vec3[] = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];

      if (ob.kind === "chimney") {
        const top = base.map((c) => [c[0], c[1] + CHIMNEY_H, c[2]] as Vec3);
        for (let i = 0; i < 4; i++) {
          poly(
            `obstacle:${ob.id}#side${i}`,
            [base[i], base[(i + 1) % 4], top[(i + 1) % 4], top[i]],
            selected ? COLORS.obstacleSelected : COLORS.chimney,
          );
        }
        poly(`obstacle:${ob.id}#top`, top, selected ? COLORS.obstacleSelected : COLORS.chimney);
      } else {
        poly(`obstacle:${ob.id}#0`, base, selected ? COLORS.obstacleSelected : COLORS.window);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={props.className ?? "h-[28rem] w-full overflow-hidden rounded-lg"}
    />
  );
}
