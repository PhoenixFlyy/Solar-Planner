"use client";

import { useEffect, useMemo, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";

import type { RoofGeometry, Vec3 } from "@/lib/templates";
import { sunDirection, type SunPosition } from "@/lib/solar/sun-position";
import type { Obstacle, PanelPlacement } from "@/lib/solar/panel-layout";
import { RoofMesh } from "./RoofMesh";
import { PanelLayer } from "./PanelLayer";
import { ObstacleLayer } from "./ObstacleLayer";

const EMPTY: Set<string> = new Set();
const NO_OBSTACLES: Obstacle[] = [];

/** Registers a PNG capture fn (needs Canvas gl preserveDrawingBuffer). */
function Capturer({ captureRef }: { captureRef: RefObject<(() => string) | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    captureRef.current = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL("image/png");
    };
    return () => {
      captureRef.current = null;
    };
  }, [gl, scene, camera, captureRef]);
  return null;
}

export interface RoofSceneProps {
  geometry: RoofGeometry;
  selectedSurfaceId?: string | null;
  onSelectSurface?: (id: string, point: Vec3) => void;
  /** Sun position for the directional light; omitted = a fixed default sun. */
  sun?: SunPosition;
  panels?: PanelPlacement[];
  removedPanels?: Set<string>;
  onTogglePanel?: (id: string) => void;
  panelColorFor?: (placement: PanelPlacement) => string;
  obstacles?: Obstacle[];
  selectedObstacleId?: string | null;
  onMoveObstacle?: (id: string, u: number, v: number) => void;
  onSelectObstacle?: (id: string | null) => void;
  /** Receives a PNG-capture function once the scene is mounted. */
  captureRef?: RefObject<(() => string) | null>;
  className?: string;
}

/**
 * Schematic 3D house viewer (ADR-0003, CLAUDE.md 3D conventions): Y up,
 * Z north, meters. One directional sun + one ambient fill, PCFSoftShadowMap.
 */
export function RoofScene({
  geometry,
  selectedSurfaceId,
  onSelectSurface,
  sun,
  panels,
  removedPanels,
  onTogglePanel,
  panelColorFor,
  obstacles,
  selectedObstacleId,
  onMoveObstacle,
  onSelectObstacle,
  captureRef,
  className,
}: RoofSceneProps) {
  const target: [number, number, number] = [0, geometry.ridgeHeightM / 2, 0];
  const reach = Math.max(geometry.footprintWidthM, geometry.footprintDepthM);

  const { lightPos, daylight } = useMemo(() => {
    const dist = reach * 2.5;
    if (!sun) return { lightPos: [reach, reach * 1.5, reach * 0.6] as const, daylight: 1 };
    const [dx, dy, dz] = sunDirection(sun.azimuthDeg, Math.max(sun.elevationDeg, 2));
    // Fade out below the horizon (dusk/night).
    const day = Math.max(0, Math.min(1, (sun.elevationDeg + 2) / 8));
    return { lightPos: [dx * dist, dy * dist, dz * dist] as const, daylight: day };
  }, [sun, reach]);

  return (
    <div
      className={className ?? "h-[28rem] w-full overflow-hidden rounded-lg bg-sky-50"}
      data-testid="roof-scene"
    >
      <Canvas
        shadows
        camera={{ position: [reach, reach * 0.9, reach], fov: 45 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true }}
        onPointerMissed={() => onSelectObstacle?.(null)}
      >
        {captureRef && <Capturer captureRef={captureRef} />}
        <ambientLight intensity={0.35 + 0.2 * daylight} />
        <directionalLight
          position={lightPos}
          intensity={0.3 + 1.2 * daylight}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-reach}
          shadow-camera-right={reach}
          shadow-camera-top={reach}
          shadow-camera-bottom={-reach}
          shadow-camera-near={0.5}
          shadow-camera-far={reach * 6}
        />

        {/* Visible sun marker */}
        {sun && sun.elevationDeg > 0 && (
          <mesh position={lightPos}>
            <sphereGeometry args={[reach * 0.06, 16, 16]} />
            <meshBasicMaterial color="#fde047" />
          </mesh>
        )}

        <RoofMesh
          geometry={geometry}
          selectedSurfaceId={selectedSurfaceId}
          onSelectSurface={onSelectSurface}
        />

        {panels && panels.length > 0 && (
          <PanelLayer
            placements={panels}
            removed={removedPanels ?? EMPTY}
            onTogglePanel={onTogglePanel}
            colorFor={panelColorFor}
          />
        )}

        {onMoveObstacle && onSelectObstacle && (
          <ObstacleLayer
            geometry={geometry}
            obstacles={obstacles ?? NO_OBSTACLES}
            selectedId={selectedObstacleId}
            onMove={onMoveObstacle}
            onSelect={onSelectObstacle}
          />
        )}

        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[reach * 6, reach * 6]} />
          <meshStandardMaterial color="#d6d3d1" />
        </mesh>
        <Grid
          args={[reach * 4, reach * 4]}
          cellSize={1}
          sectionSize={5}
          infiniteGrid
          fadeDistance={reach * 6}
          cellColor="#a8a29e"
          sectionColor="#78716c"
          position={[0, 0.01, 0]}
        />

        <OrbitControls target={target} maxPolarAngle={Math.PI / 2.05} enableDamping />
      </Canvas>
    </div>
  );
}
