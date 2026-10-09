"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scaleDistance } from "@/lib/bodies";
import { sim } from "@/lib/store";
import { createRadialTexture } from "@/lib/textures";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function AsteroidBelt({ count = 2600 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const rand = rng(42);
    const obj = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const au = 2.1 + Math.pow(rand(), 0.9) * 1.2;
      const r = scaleDistance(au) + (rand() - 0.5) * 1.2;
      const a = rand() * Math.PI * 2;
      obj.position.set(Math.cos(a) * r, (rand() - 0.5) * 2.2, Math.sin(a) * r);
      obj.rotation.set(rand() * 6, rand() * 6, rand() * 6);
      const s = 0.05 + Math.pow(rand(), 4) * 0.28;
      obj.scale.set(s, s * (0.6 + rand() * 0.5), s * (0.7 + rand() * 0.4));
      obj.updateMatrix();
      m.setMatrixAt(i, obj.matrix);
      const k = 0.45 + rand() * 0.35;
      m.setColorAt(i, color.setRGB(k, k * 0.93, k * 0.85));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame(() => {
    if (group.current) group.current.rotation.y = ((sim.days / (4.6 * 365.25)) * Math.PI * 2) % (Math.PI * 2);
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} raycast={() => null}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} metalness={0} flatShading />
      </instancedMesh>
    </group>
  );
}

export function KuiperBelt({ count = 6000 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const sprite = useMemo(
    () => createRadialTexture([[0, "rgba(255,255,255,1)"], [0.4, "rgba(255,255,255,0.4)"], [1, "rgba(0,0,0,0)"]], 64),
    [],
  );
  const geometry = useMemo(() => {
    const rand = rng(7);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const au = 30 + rand() * 20 + (rand() < 0.4 ? (rand() - 0.5) * 6 : 0);
      const r = scaleDistance(au);
      const a = rand() * Math.PI * 2;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (rand() - 0.5) * (6 + rand() * 10);
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useFrame(() => {
    if (group.current) group.current.rotation.y = ((sim.days / (300 * 365.25)) * Math.PI * 2) % (Math.PI * 2);
  });

  return (
    <group ref={group}>
      <points geometry={geometry} raycast={() => null}>
        <pointsMaterial
          map={sprite}
          size={0.9}
          color="#9fb3c8"
          transparent
          opacity={0.55}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
