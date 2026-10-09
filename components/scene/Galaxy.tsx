"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GALAXY_RADIUS, SUN_GALACTIC_DISTANCE } from "@/lib/bodies";
import { GALAXY_TILT, LOGDEPTH } from "@/lib/space";
import { createRadialTexture } from "@/lib/textures";
import { useStore } from "@/lib/store";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function gauss(rand: () => number) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const vertex = `
  ${LOGDEPTH.vertPars}
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uScale;
  uniform float uPixelRatio;
  uniform float uInside;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float d = max(-mv.z, 0.001);
    float size = aSize * uScale / d;
    float alpha = smoothstep(150.0, 1400.0, d);
    if (size < 1.0) { alpha *= size; size = 1.0; }
    float maxSize = mix(3.0, 16.0, smoothstep(3000.0, 14000.0, d));
    alpha *= clamp(maxSize / size, 0.05, 1.0) * clamp(6.0 / min(size, maxSize), 0.08, 1.0);
    gl_PointSize = min(size, maxSize) * uPixelRatio;
    vColor = aColor * mix(1.45, 0.3, uInside);
    vAlpha = alpha;
    gl_Position = projectionMatrix * mv;
    ${LOGDEPTH.vert}
  }
`;

const fragment = `
  ${LOGDEPTH.fragPars}
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    ${LOGDEPTH.frag}
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    float a = pow(1.0 - r, 2.2) * vAlpha;
    gl_FragColor = vec4(vColor * a, 1.0);
  }
`;

type RGB = [number, number, number];

function buildGalaxy() {
  const rand = rng(1337);
  const ARMS = 4;
  const PITCH = Math.tan(THREE.MathUtils.degToRad(13));
  const R0 = 700;
  const nBulge = 20_000;
  const nArms = 75_000;
  const nDisk = 22_000;
  const nHII = 3_000;
  const total = nBulge + nArms + nDisk + nHII;

  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const size = new Float32Array(total);
  let i = 0;

  const push = (x: number, y: number, z: number, c: RGB, b: number, s: number) => {
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    col[i * 3] = c[0] * b;
    col[i * 3 + 1] = c[1] * b;
    col[i * 3 + 2] = c[2] * b;
    size[i] = s;
    i++;
  };

  const barAngle = THREE.MathUtils.degToRad(27);
  for (let k = 0; k < nBulge; k++) {
    const r = Math.abs(gauss(rand)) * 950;
    const th = rand() * Math.PI * 2;
    let x = Math.cos(th) * r * 1.9;
    let z = Math.sin(th) * r * 0.75;
    const y = gauss(rand) * 260 * Math.exp(-r / 2000);
    const bx = x * Math.cos(barAngle) - z * Math.sin(barAngle);
    z = x * Math.sin(barAngle) + z * Math.cos(barAngle);
    x = bx;
    const warm: RGB = [1.0, 0.82 - rand() * 0.1, 0.55 - rand() * 0.15];
    push(x, y, z, warm, 0.22 + rand() * 0.25, 40 + rand() * 50);
  }

  for (let k = 0; k < nArms; k++) {
    const arm = k % ARMS;
    const major = arm % 2 === 0;
    const r = Math.min(GALAXY_RADIUS, R0 + -Math.log(1 - rand() * 0.985) * 3300);
    const base = (arm / ARMS) * Math.PI * 2 + Math.log(r / R0) / PITCH;
    const spread = gauss(rand) * (major ? 0.13 : 0.19) * (0.7 + r / GALAXY_RADIUS);
    const th = base + spread;
    const off = gauss(rand) * 120;
    const x = Math.cos(th) * r + off;
    const z = Math.sin(th) * r + gauss(rand) * 120;
    const y = gauss(rand) * (70 + r * 0.012);
    const t = rand();
    const c: RGB = t < 0.6 ? [0.62, 0.74, 1.0] : t < 0.9 ? [0.92, 0.92, 1.0] : [1.0, 0.86, 0.7];
    push(x, y, z, c, (major ? 0.3 : 0.2) + rand() * 0.22, 28 + rand() * 46);
  }

  for (let k = 0; k < nDisk; k++) {
    const r = Math.min(GALAXY_RADIUS * 1.1, -Math.log(1 - rand() * 0.99) * 3600 + 300);
    const th = rand() * Math.PI * 2;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const y = gauss(rand) * (90 + r * 0.015);
    push(x, y, z, [0.95, 0.88, 0.78], 0.05 + rand() * 0.08, 30 + rand() * 50);
  }

  for (let k = 0; k < nHII; k++) {
    const arm = k % ARMS;
    const r = R0 * 2 + rand() * (GALAXY_RADIUS - R0 * 2);
    const th = (arm / ARMS) * Math.PI * 2 + Math.log(r / R0) / PITCH + gauss(rand) * 0.12;
    push(
      Math.cos(th) * r + gauss(rand) * 60,
      gauss(rand) * 40,
      Math.sin(th) * r + gauss(rand) * 60,
      [1.0, 0.45, 0.65],
      0.35 + rand() * 0.3,
      30 + rand() * 40,
    );
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), GALAXY_RADIUS * 1.2);
  return g;
}

export function Galaxy() {
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(buildGalaxy, []);
  const uniforms = useMemo(() => ({ uScale: { value: 420 }, uPixelRatio: { value: 1 }, uInside: { value: 1 } }), []);
  useFrame(({ camera }) => {
    uniforms.uInside.value = 1 - THREE.MathUtils.smoothstep(camera.position.length(), 2500, 9000);
  });
  uniforms.uPixelRatio.value = dpr;

  const coreTex = useMemo(
    () =>
      createRadialTexture([
        [0, "rgba(255,236,200,0.9)"],
        [0.2, "rgba(255,210,150,0.35)"],
        [0.55, "rgba(200,170,140,0.08)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );
  const diskTex = useMemo(
    () =>
      createRadialTexture([
        [0, "rgba(255,225,190,0.35)"],
        [0.3, "rgba(170,180,230,0.12)"],
        [0.7, "rgba(90,110,180,0.04)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );

  const near = useStore((s) => s.nearSystem);

  return (
    <group rotation={[GALAXY_TILT, 0, 0]}>
      <group position={[-SUN_GALACTIC_DISTANCE, 0, 0]}>
        <points geometry={geometry} raycast={() => null} frustumCulled={false}>
          <shaderMaterial
            vertexShader={vertex}
            fragmentShader={fragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null} visible={!near}>
          <planeGeometry args={[GALAXY_RADIUS * 2.4, GALAXY_RADIUS * 2.4]} />
          <meshBasicMaterial
            map={diskTex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            opacity={0.45}
          />
        </mesh>
        <sprite scale={[5200, 5200, 1]} raycast={() => null}>
          <spriteMaterial
            map={coreTex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={near ? 0.12 : 0.7}
          />
        </sprite>
      </group>
    </group>
  );
}
