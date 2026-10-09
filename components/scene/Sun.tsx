"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN_RADIUS } from "@/lib/bodies";
import { bodies, select } from "@/lib/store";
import { createRadialTexture } from "@/lib/textures";

const vertex = `
  #include <common>
  #include <logdepthbuf_pars_vertex>
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
    #include <logdepthbuf_vertex>
  }
`;

const fragment = `
  #include <logdepthbuf_pars_fragment>
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    #include <logdepthbuf_fragment>
    vec3 p = normalize(vPos);
    float n1 = fbm(p * 3.0 + vec3(0.0, uTime * 0.03, uTime * 0.02));
    float n2 = fbm(p * 9.0 - vec3(uTime * 0.06));
    float granules = noise(p * 28.0 + n1 * 2.0);
    float heat = n1 * 0.55 + n2 * 0.3 + granules * 0.25;
    vec3 col = mix(vec3(1.0, 0.42, 0.06), vec3(1.0, 0.8, 0.36), smoothstep(0.3, 0.68, heat));
    col = mix(col, vec3(1.0, 0.95, 0.7), smoothstep(0.7, 0.9, heat));
    float ndv = clamp(dot(vNormal, vView), 0.0, 1.0);
    col *= mix(0.55, 1.0, pow(ndv, 0.45));
    gl_FragColor = vec4(col * 1.6, 1.0);
  }
`;

export function Sun() {
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const glow = useMemo(
    () =>
      createRadialTexture([
        [0, "rgba(255,230,170,1)"],
        [0.15, "rgba(255,190,90,0.55)"],
        [0.4, "rgba(255,130,40,0.15)"],
        [1, "rgba(0,0,0,0)"],
      ]),
    [],
  );

  useEffect(() => {
    if (mesh.current) bodies.set("sun", { object: mesh.current, radius: SUN_RADIUS });
    return () => {
      bodies.delete("sun");
    };
  }, []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (mesh.current) mesh.current.rotation.y += delta * 0.02;
  });

  return (
    <group>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          select("sun");
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} toneMapped={false} />
      </mesh>
      <sprite scale={[SUN_RADIUS * 7, SUN_RADIUS * 7, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
      </sprite>
      <sprite scale={[SUN_RADIUS * 16, SUN_RADIUS * 16, 1]}>
        <spriteMaterial
          map={glow}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </sprite>
      <pointLight intensity={3} decay={0} color="#fff3e0" />
    </group>
  );
}
