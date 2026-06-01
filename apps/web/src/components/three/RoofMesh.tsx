"use client";

import { useMemo } from "react";
import * as THREE from "three";

import type { RoofGeometry, Vec3 } from "@/lib/templates";
import { polygonGeometry, wallsGeometry } from "./geometry-utils";

const WALL_COLOR = "#e7e5e4"; // stone-200
const ROOF_COLOR = "#9a3412"; // orange-900-ish (roof tile)
const ROOF_SELECTED = "#f59e0b"; // amber-500

export interface RoofMeshProps {
  geometry: RoofGeometry;
  selectedSurfaceId?: string | null;
  /** Called on roof-face click with the surface id and the world hit point. */
  onSelectSurface?: (id: string, point: Vec3) => void;
}

export function RoofMesh({ geometry, selectedSurfaceId, onSelectSurface }: RoofMeshProps) {
  const walls = useMemo(
    () => wallsGeometry(geometry.groundPolygon, geometry.eaveHeightM),
    [geometry.groundPolygon, geometry.eaveHeightM],
  );
  const gables = useMemo(
    () => geometry.gableFaces.map((f) => polygonGeometry(f)),
    [geometry.gableFaces],
  );
  const surfaces = useMemo(
    () => geometry.surfaces.map((s) => ({ id: s.id, geo: polygonGeometry(s.polygon) })),
    [geometry.surfaces],
  );

  return (
    <group>
      <mesh geometry={walls} castShadow receiveShadow>
        <meshStandardMaterial color={WALL_COLOR} side={THREE.DoubleSide} />
      </mesh>

      {gables.map((geo, i) => (
        <mesh key={`gable-${i}`} geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial color={WALL_COLOR} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {surfaces.map(({ id, geo }) => (
        <mesh
          key={id}
          geometry={geo}
          castShadow
          receiveShadow
          onClick={
            onSelectSurface
              ? (e) => {
                  e.stopPropagation();
                  onSelectSurface(id, [e.point.x, e.point.y, e.point.z]);
                }
              : undefined
          }
        >
          <meshStandardMaterial
            color={selectedSurfaceId === id ? ROOF_SELECTED : ROOF_COLOR}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
