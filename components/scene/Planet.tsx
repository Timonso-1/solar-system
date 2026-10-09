"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { moonRadius, scaleDistance, scaleRadius, type MoonData, type PlanetData } from "@/lib/bodies";
import { bodies, select, sim, useStore } from "@/lib/store";
import { createCloudTexture, createPlanetTexture, createRingTexture } from "@/lib/textures";
import { LOGDEPTH, seedFrom } from "@/lib/space";

const TAU = Math.PI * 2;

function CircleLine({ radius, color, opacity, segments = 256 }: { radius: number; color: string; opacity: number; segments?: number }) {
  const line = useMemo(() => {
    const pos = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * TAU;
      pos[i * 3] = Math.cos(a) * radius;
      pos[i * 3 + 2] = -Math.sin(a) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, depthWrite: false });
    const l = new THREE.LineLoop(g, m);
    l.raycast = () => null;
    return l;
  }, [radius, color, segments]);
  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);
  (line.material as THREE.LineBasicMaterial).opacity = opacity;
  return <primitive object={line} />;
}

export function Orbit({ radius, color, active }: { radius: number; color: string; active: boolean }) {
  const show = useStore((s) => s.showOrbits);
  if (!show) return null;
  return <CircleLine radius={radius} color={color} opacity={active ? 0.9 : 0.35} />;
}

const atmoVertex = `
  ${LOGDEPTH.vertPars}
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;
  varying vec3 vSunDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vSunDir = normalize(-world.xyz);
    vec4 mv = viewMatrix * world;
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
    ${LOGDEPTH.vert}
  }
`;

const atmoFragment = `
  ${LOGDEPTH.fragPars}
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldNormal;
  varying vec3 vSunDir;
  void main() {
    ${LOGDEPTH.frag}
    float fres = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), 2.6);
    float lit = smoothstep(-0.35, 0.5, dot(vWorldNormal, vSunDir));
    gl_FragColor = vec4(uColor * fres * lit * uIntensity, 1.0);
  }
`;

function Atmosphere({ radius, color, intensity }: { radius: number; color: string; intensity: number }) {
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } }),
    [color, intensity],
  );
  return (
    <mesh scale={1.06} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 32]} />
      <shaderMaterial
        vertexShader={atmoVertex}
        fragmentShader={atmoFragment}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

function Ring({ inner, outer, opacity, tint }: NonNullable<PlanetData["ring"]>) {
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(inner, outer, 160, 1);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5);
    }
    return g;
  }, [inner, outer]);
  const map = useMemo(() => createRingTexture(tint), [tint]);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <meshStandardMaterial
        map={map}
        side={THREE.DoubleSide}
        transparent
        opacity={opacity}
        depthWrite={false}
        roughness={1}
        metalness={0}
        emissive="#ffffff"
        emissiveMap={map}
        emissiveIntensity={0.12}
      />
    </mesh>
  );
}

function Moon({ moon, planetRadius }: { moon: MoonData; planetRadius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const seed = seedFrom(moon.id);
  const r = moonRadius(moon.diameterKm);
  const d = planetRadius * moon.distanceFactor + r;
  const phase = (seed % 360) * (Math.PI / 180);
  const map = useMemo(() => createPlanetTexture("rock", seed, moon.color), [seed, moon.color]);
  const showOrbits = useStore((s) => s.showOrbits);

  useFrame(() => {
    if (!ref.current) return;
    const a = phase + (TAU * sim.spinDays) / moon.periodDays;
    ref.current.position.set(Math.cos(a) * d, 0, -Math.sin(a) * d);
    ref.current.rotation.y = a;
  });

  return (
    <>
      {showOrbits && <CircleLine radius={d} color="#ffffff" opacity={0.12} segments={128} />}
      <mesh ref={ref} raycast={() => null}>
        <sphereGeometry args={[r, 24, 16]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}

export function Planet({ data }: { data: PlanetData }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Mesh>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const radius = scaleRadius(data.diameterKm);
  const dist = scaleDistance(data.distanceAU);
  const seed = seedFrom(data.id);
  const active = useStore((s) => s.selected === data.id);

  const map = useMemo(() => createPlanetTexture(data.texture, seed, data.baseColor), [data.texture, seed, data.baseColor]);
  const cloudMap = useMemo(() => (data.id === "earth" ? createCloudTexture(seed + 11) : null), [data.id, seed]);

  useEffect(() => {
    if (!group.current) return;
    bodies.set(data.id, { object: group.current, radius: radius * (data.ring ? data.ring.outer * 0.8 : 1) });
    return () => {
      bodies.delete(data.id);
    };
  }, [data.id, data.ring, radius]);

  useFrame(() => {
    if (!group.current) return;
    const ang = THREE.MathUtils.degToRad(data.meanLongitudeJ2000 + (360 * sim.days) / data.orbitalPeriodDays);
    group.current.position.set(Math.cos(ang) * dist, 0, -Math.sin(ang) * dist);
    if (spin.current) spin.current.rotation.y = (((sim.spinDays * 24) / data.rotationHours) * TAU) % TAU;
    if (clouds.current) clouds.current.rotation.y = (((sim.spinDays * 24) / (data.rotationHours * 0.92)) * TAU) % TAU;
  });

  const atmo =
    data.id === "earth"
      ? { color: "#5aa8ff", intensity: 1.6 }
      : data.id === "venus"
        ? { color: "#ffd9a0", intensity: 0.9 }
        : data.id === "mars"
          ? { color: "#ff9a6a", intensity: 0.35 }
          : data.texture === "uranus" || data.texture === "neptune"
            ? { color: "#9fd8ff", intensity: 0.6 }
            : null;

  const hitRadius = Math.max(radius * 1.25, 1.4);

  return (
    <group rotation={[0, THREE.MathUtils.degToRad(data.nodeDeg ?? 0), 0]}>
    <group rotation={[THREE.MathUtils.degToRad(data.inclinationDeg ?? 0), 0, 0]}>
      <Orbit radius={dist} color={data.orbitColor} active={active} />
      <group ref={group}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            select(data.id);
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "")}
        >
          <sphereGeometry args={[hitRadius, 12, 8]} />
          <meshBasicMaterial colorWrite={false} depthWrite={false} transparent opacity={0} />
        </mesh>
        <group rotation={[0, 0, THREE.MathUtils.degToRad(data.axialTiltDeg)]}>
          <mesh ref={spin} raycast={() => null}>
            <sphereGeometry args={[radius, 48, 32]} />
            <meshStandardMaterial map={map} roughness={1} metalness={0} />
          </mesh>
          {cloudMap && (
            <mesh ref={clouds} scale={1.012} raycast={() => null}>
              <sphereGeometry args={[radius, 48, 32]} />
              <meshStandardMaterial map={cloudMap} transparent depthWrite={false} roughness={1} metalness={0} />
            </mesh>
          )}
          {atmo && <Atmosphere radius={radius} color={atmo.color} intensity={atmo.intensity} />}
          {data.ring && (
            <Ring
              inner={radius * data.ring.inner}
              outer={radius * data.ring.outer}
              opacity={data.ring.opacity}
              tint={data.ring.tint}
            />
          )}
        </group>
        {data.moonList?.map((m) => <Moon key={m.id} moon={m} planetRadius={radius} />)}
      </group>
    </group>
    </group>
  );
}
