"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createDistantGalaxyTexture, createRadialTexture } from "@/lib/textures";
import { GALACTIC_CENTER } from "@/lib/space";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function randomDir(rand: () => number, out = new THREE.Vector3()) {
  const u = rand() * 2 - 1;
  const t = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return out.set(s * Math.cos(t), u, s * Math.sin(t));
}

const starTex = () =>
  createRadialTexture([[0, "rgba(255,255,255,1)"], [0.25, "rgba(255,255,255,0.6)"], [1, "rgba(0,0,0,0)"]], 64);

export function Starfield({ count = 9000 }: { count?: number }) {
  const mat = useRef<THREE.PointsMaterial>(null);
  const tex = useMemo(starTex, []);
  const geometry = useMemo(() => {
    const rand = rng(99);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const v = new THREE.Vector3();
    const palette: [number, number, number][] = [
      [0.7, 0.8, 1.0],
      [1.0, 1.0, 1.0],
      [1.0, 0.95, 0.8],
      [1.0, 0.8, 0.6],
      [1.0, 0.7, 0.55],
    ];
    for (let i = 0; i < count; i++) {
      randomDir(rand, v).multiplyScalar(1800 + rand() * 2200);
      pos.set([v.x, v.y, v.z], i * 3);
      const c = palette[Math.floor(rand() * palette.length)];
      const b = 0.35 + Math.pow(rand(), 3) * 0.9;
      col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);

  useFrame(({ camera }) => {
    if (!mat.current) return;
    const d = camera.position.length();
    mat.current.opacity = 1 - THREE.MathUtils.smoothstep(d, 2500, 7000);
    mat.current.visible = mat.current.opacity > 0.01;
  });

  return (
    <points geometry={geometry} raycast={() => null} frustumCulled={false}>
      <pointsMaterial
        ref={mat}
        map={tex}
        size={2.2}
        sizeAttenuation={false}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function DistantGalaxies({ detailed = 70, dots = 26000 }: { detailed?: number; dots?: number }) {
  const items = useMemo(() => {
    const rand = rng(2024);
    const textures = Array.from({ length: 10 }, (_, i) => createDistantGalaxyTexture(500 + i * 31));
    const v = new THREE.Vector3();
    return Array.from({ length: detailed }, (_, i) => {
      randomDir(rand, v).multiplyScalar(140_000 + rand() * 360_000);
      const pos = v.clone().add(GALACTIC_CENTER);
      const euler = new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      return {
        key: i,
        pos,
        euler,
        size: 1_800 + Math.pow(rand(), 2) * 5_500,
        map: textures[i % textures.length],
        opacity: 0.55 + rand() * 0.45,
      };
    });
  }, [detailed]);

  const dotTex = useMemo(starTex, []);
  const dotGeom = useMemo(() => {
    const rand = rng(77);
    const pos = new Float32Array(dots * 3);
    const col = new Float32Array(dots * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < dots; i++) {
      randomDir(rand, v).multiplyScalar(120_000 + rand() * 650_000);
      if (rand() < 0.5) v.multiplyScalar(0.9 + Math.sin(v.x * 0.00002) * 0.1);
      pos.set([v.x + GALACTIC_CENTER.x, v.y + GALACTIC_CENTER.y, v.z + GALACTIC_CENTER.z], i * 3);
      const warm = rand();
      const b = 0.25 + rand() * 0.5;
      col.set([b, b * (0.85 + warm * 0.1), b * (0.75 + (1 - warm) * 0.35)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [dots]);

  return (
    <group>
      {items.map((g) => (
        <mesh key={g.key} position={g.pos} rotation={g.euler} raycast={() => null}>
          <planeGeometry args={[g.size, g.size]} />
          <meshBasicMaterial
            map={g.map}
            transparent
            opacity={g.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <points geometry={dotGeom} raycast={() => null} frustumCulled={false}>
        <pointsMaterial
          map={dotTex}
          size={2.4}
          sizeAttenuation={false}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
