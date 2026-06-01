"use client";

import { useMemo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import type { RoofGeometry } from "@/lib/templates";
import {
  projectToSurfaceUV,
  surfaceBasis,
  surfaceUVBounds,
  surfaceUVToWorld,
  type Obstacle,
} from "@/lib/solar/panel-layout";

const KIND_COLOR: Record<Obstacle["kind"], string> = {
  window: "#7dd3fc", // sky-300
  chimney: "#78716c", // stone-500
  other: "#a8a29e", // stone-400
};
const SELECTED_COLOR = "#f59e0b";
const SNAP = 0.5;
const CHIMNEY_HEIGHT_M = 1.2;

export interface ObstacleLayerProps {
  geometry: RoofGeometry;
  obstacles: Obstacle[];
  selectedId?: string | null;
  onMove: (id: string, u: number, v: number) => void;
  onSelect: (id: string | null) => void;
}

/** Render roof obstacles as boxes; drag to move (snap-to-grid) on the face. */
export function ObstacleLayer({
  geometry,
  obstacles,
  selectedId,
  onMove,
  onSelect,
}: ObstacleLayerProps) {
  const { camera, gl, raycaster } = useThree();

  const items = useMemo(() => {
    return obstacles
      .map((ob) => {
        const surface = geometry.surfaces.find((s) => s.id === ob.surfaceId);
        if (!surface) return null;
        const basis = surfaceBasis(surface.polygon);
        return { ob, surface, basis, bounds: surfaceUVBounds(surface.polygon) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [obstacles, geometry.surfaces]);

  function startDrag(e: ThreeEvent<PointerEvent>, item: (typeof items)[number]) {
    e.stopPropagation();
    onSelect(item.ob.id);

    const { basis, bounds, ob } = item;
    const halfW = ob.widthM / 2;
    const halfH = ob.heightM / 2;
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      new THREE.Vector3(...basis.n),
      new THREE.Vector3(...basis.o),
    );
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2();
    const hit = new THREE.Vector3();

    const onMoveDoc = (ev: PointerEvent) => {
      ndc.set(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;
      const { u, v } = projectToSurfaceUV(basis, [hit.x, hit.y, hit.z]);
      const snap = (n: number) => Math.round(n / SNAP) * SNAP;
      const cu = Math.min(Math.max(snap(u), bounds.minU + halfW), bounds.maxU - halfW);
      const cv = Math.min(Math.max(snap(v), bounds.minV + halfH), bounds.maxV - halfH);
      onMove(ob.id, cu, cv);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMoveDoc);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMoveDoc);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <group>
      {items.map((item) => {
        const { ob, basis } = item;
        const center = surfaceUVToWorld(basis, ob.u, ob.v);
        const color = ob.id === selectedId ? SELECTED_COLOR : KIND_COLOR[ob.kind];

        // Chimney: a real vertical stack rising from the roof (world-up box).
        if (ob.kind === "chimney") {
          const stack = CHIMNEY_HEIGHT_M;
          return (
            <mesh
              key={ob.id}
              position={[center[0], center[1] + stack / 2, center[2]]}
              castShadow
              receiveShadow
              onPointerDown={(e) => startDrag(e, item)}
            >
              <boxGeometry args={[ob.widthM, stack, ob.heightM]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
          );
        }

        // Window / other: a thin panel lying flush in the roof plane.
        const thickness = 0.12;
        const lift = thickness / 2 + 0.02;
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(
            new THREE.Vector3(...basis.u),
            new THREE.Vector3(...basis.n),
            new THREE.Vector3(...basis.v),
          ),
        );
        return (
          <mesh
            key={ob.id}
            position={[
              center[0] + basis.n[0] * lift,
              center[1] + basis.n[1] * lift,
              center[2] + basis.n[2] * lift,
            ]}
            quaternion={quaternion}
            castShadow
            receiveShadow
            onPointerDown={(e) => startDrag(e, item)}
          >
            <boxGeometry args={[ob.widthM, thickness, ob.heightM]} />
            <meshStandardMaterial
              color={color}
              roughness={ob.kind === "window" ? 0.1 : 0.7}
              metalness={ob.kind === "window" ? 0.6 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
