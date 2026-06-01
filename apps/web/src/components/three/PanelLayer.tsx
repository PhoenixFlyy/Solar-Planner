"use client";

import { useEffect, useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

import { PANEL, type PanelPlacement } from "@/lib/solar/panel-layout";

export interface PanelLayerProps {
  placements: PanelPlacement[];
  removed: Set<string>;
  onTogglePanel?: (id: string) => void;
}

/** PV modules as a single instanced mesh (CLAUDE.md: instanced for panels). */
export function PanelLayer({ placements, removed, onTogglePanel }: PanelLayerProps) {
  const { mesh, visible } = useMemo(() => {
    const visible = placements.filter((p) => !removed.has(p.id));
    const geo = new THREE.BoxGeometry(PANEL.widthM, PANEL.thicknessM, PANEL.heightM);
    const mat = new THREE.MeshStandardMaterial({
      color: "#1e3a8a",
      metalness: 0.2,
      roughness: 0.4,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, visible.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const m = new THREE.Matrix4();
    const ux = new THREE.Vector3();
    const ny = new THREE.Vector3();
    const vz = new THREE.Vector3();
    const pos = new THREE.Vector3();
    const lift = PANEL.thicknessM / 2 + 0.02; // sit just above the roof plane
    visible.forEach((p, i) => {
      ux.set(...p.u);
      ny.set(...p.normal);
      vz.set(...p.v);
      m.makeBasis(ux, ny, vz);
      pos.set(
        p.center[0] + p.normal[0] * lift,
        p.center[1] + p.normal[1] * lift,
        p.center[2] + p.normal[2] * lift,
      );
      m.setPosition(pos);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, visible };
  }, [placements, removed]);

  // Dispose GPU resources when the mesh is replaced/unmounted.
  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    };
  }, [mesh]);

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (!onTogglePanel || e.instanceId === undefined) return;
    e.stopPropagation();
    const p = visible[e.instanceId];
    if (p) onTogglePanel(p.id);
  }

  return <primitive object={mesh} onClick={handleClick} />;
}
