"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls, SoftShadows, Sky } from "@react-three/drei";

import type { RoofGeometry, Vec3 } from "@/lib/templates";
import { sunDirection, type SunPosition } from "@/lib/solar/sun-position";
import type { Obstacle, PanelPlacement } from "@/lib/solar/panel-layout";
import { RoofMesh } from "./RoofMesh";
import { PanelLayer } from "./PanelLayer";
import { ObstacleLayer } from "./ObstacleLayer";
import { Compass } from "./Compass";

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

/** Reports the camera's compass heading (deg, 0=looking north) to the HUD. */
function CameraHeading({
  target,
  onChange,
}: {
  target: [number, number, number];
  onChange: (deg: number) => void;
}) {
  const { camera } = useThree();
  useFrame(() => {
    // Direction the camera looks (target - camera) projected on the ground.
    const dx = target[0] - camera.position.x;
    const dz = target[2] - camera.position.z;
    const deg = (Math.atan2(dx, dz) * 180) / Math.PI; // 0 = +Z (north)
    onChange(deg);
  });
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
 * 3D house viewer (ADR-0003 / ADR-0008 R3F path): Y up, Z north, meters.
 * Procedural sky + a sun directional light with soft shadows; a compass HUD
 * makes orientation explicit.
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
  const [heading, setHeading] = useState(0);

  const { lightPos, daylight } = useMemo(() => {
    const dist = reach * 2.5;
    if (!sun) return { lightPos: [reach, reach * 1.5, reach * 0.6] as const, daylight: 1 };
    const [dx, dy, dz] = sunDirection(sun.azimuthDeg, Math.max(sun.elevationDeg, 2));
    const day = Math.max(0, Math.min(1, (sun.elevationDeg + 2) / 8));
    return { lightPos: [dx * dist, dy * dist, dz * dist] as const, daylight: day };
  }, [sun, reach]);

  return (
    <div
      className={className ?? "relative h-[28rem] w-full overflow-hidden rounded-lg bg-sky-100"}
      data-testid="roof-scene"
    >
      <Canvas
        shadows
        camera={{ position: [reach, reach * 0.9, reach], fov: 45 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        onPointerMissed={() => onSelectObstacle?.(null)}
      >
        {captureRef && <Capturer captureRef={captureRef} />}
        <CameraHeading
          target={target}
          onChange={(d) => setHeading((h) => (Math.abs(h - d) > 0.5 ? d : h))}
        />

        <SoftShadows size={28} samples={12} focus={0.9} />

        {/* Procedural sky positioned at the sun (no external asset). */}
        <Sky sunPosition={lightPos} turbidity={6} rayleigh={1.5} mieCoefficient={0.005} />

        {/* Sky/ground fill + the sun. */}
        <hemisphereLight args={["#bcd4ff", "#6b8e4e", 0.5 + 0.3 * daylight]} />
        <ambientLight intensity={0.18 + 0.12 * daylight} />
        <directionalLight
          position={lightPos}
          intensity={0.4 + 1.5 * daylight}
          color={daylight < 0.4 ? "#ffd9a0" : "#fff6e6"}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0004}
          shadow-camera-left={-reach}
          shadow-camera-right={reach}
          shadow-camera-top={reach}
          shadow-camera-bottom={-reach}
          shadow-camera-near={0.5}
          shadow-camera-far={reach * 6}
        />

        {sun && sun.elevationDeg > 0 && (
          <mesh position={lightPos}>
            <sphereGeometry args={[reach * 0.05, 16, 16]} />
            <meshBasicMaterial color="#fff3b0" />
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

        {/* Grass ground + faint grid. */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[reach * 8, reach * 8]} />
          <meshStandardMaterial color="#6f9355" roughness={1} />
        </mesh>
        <Grid
          args={[reach * 4, reach * 4]}
          cellSize={1}
          sectionSize={5}
          infiniteGrid
          fadeDistance={reach * 5}
          cellColor="#5f8049"
          sectionColor="#4d6b3b"
          position={[0, 0.005, 0]}
        />

        <OrbitControls target={target} maxPolarAngle={Math.PI / 2.05} enableDamping />
      </Canvas>

      <Compass headingDeg={heading} />
    </div>
  );
}
