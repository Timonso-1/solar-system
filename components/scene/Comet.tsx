"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALLEY } from "@/lib/bodies";
import { fromEccentricAnomaly, halleyAt, toScene } from "@/lib/orbits";
import { bodies, select, sim, useStore } from "@/lib/store";
import { createRadialTexture } from "@/lib/textures";

const au = new THREE.Vector3();
const away = new THREE.Vector3();

export function Comet() {
  const group = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const tailMat = useRef<THREE.PointsMaterial>(null);
  const coma = useRef<THREE.Sprite>(null);
  const showOrbits = useStore((s) => s.showOrbits);
  const active = useStore((s) => s.selected === HALLEY.id);

  const orbit = useMemo(() => {
    const n = 1024;
    const pos = new Float32Array(n * 3);
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      fromEccentricAnomaly((i / n) * Math.PI * 2, v);
      toScene(v, s);
      pos.set([s.x, s.y, s.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const line = new THREE.LineLoop(g, new THREE.LineBasicMaterial({ color: "#7fd3c4", transparent: true, depthWrite: false }));
    line.raycast = () => null;
    return line;
  }, []);

  const tailGeom = useMemo(() => {
    const n = 7000;
    const pos = new Float32Array(n * 3);
    let seed = 91;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < n; i++) {
      const z = Math.pow(rand(), 1.8);
      const spread = 0.015 + z * 0.13;
      const a = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.8) * spread;
      pos.set([Math.cos(a) * r, Math.sin(a) * r, z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const dot = useMemo(
    () => createRadialTexture([[0, "rgba(255,255,255,1)"], [0.35, "rgba(255,255,255,0.35)"], [1, "rgba(0,0,0,0)"]], 64),
    [],
  );
  const comaTex = useMemo(
    () =>
      createRadialTexture([
        [0, "rgba(230,250,255,1)"],
        [0.2, "rgba(160,220,255,0.45)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );

  useEffect(() => {
    if (!group.current) return;
    bodies.set(HALLEY.id, { object: group.current, radius: 1.3 });
    return () => {
      bodies.delete(HALLEY.id);
    };
  }, []);

  useEffect(() => () => {
    orbit.geometry.dispose();
    (orbit.material as THREE.Material).dispose();
  }, [orbit]);

  (orbit.material as THREE.LineBasicMaterial).opacity = active ? 0.8 : 0.28;

  useFrame(() => {
    if (!group.current) return;
    halleyAt(sim.days, au);
    const r = au.length();
    toScene(au, group.current.position);
    const len = Math.min(18, 16 / Math.pow(Math.max(r, 0.5), 1.15));
    if (tail.current) {
      away.copy(group.current.position).multiplyScalar(2);
      tail.current.lookAt(away);
      tail.current.scale.setScalar(Math.max(len, 0.01));
    }
    if (tailMat.current) {
      tailMat.current.opacity = THREE.MathUtils.smoothstep(len, 1.2, 6) * 0.85;
      tailMat.current.visible = tailMat.current.opacity > 0.01;
    }
    if (coma.current) coma.current.scale.setScalar(0.5 + Math.min(len, 20) * 0.14);
  });

  return (
    <>
      {showOrbits && <primitive object={orbit} />}
      <group ref={group}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            select(HALLEY.id);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <sphereGeometry args={[1.3, 10, 8]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} transparent opacity={0} />
        </mesh>
        <mesh raycast={() => null}>
          <icosahedronGeometry args={[0.07, 1]} />
          <meshStandardMaterial color="#8a8580" roughness={1} flatShading />
        </mesh>
        <sprite ref={coma} raycast={() => null}>
          <spriteMaterial map={comaTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.8} />
        </sprite>
        <group ref={tail}>
          <points geometry={tailGeom} raycast={() => null} frustumCulled={false}>
            <pointsMaterial
              ref={tailMat}
              map={dot}
              color="#bfe8ff"
              size={0.11}
              sizeAttenuation
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>
      </group>
    </>
  );
}
