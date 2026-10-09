"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { PLANETS } from "@/lib/bodies";
import { store, useStore } from "@/lib/store";
import { Sun } from "./Sun";
import { Planet } from "./Planet";
import { AsteroidBelt, KuiperBelt } from "./Belts";
import { Galaxy } from "./Galaxy";
import { LabelProjector } from "./LabelProjector";
import { DistantGalaxies, Starfield } from "./Universe";
import { CameraRig, SimClock } from "./CameraRig";
import { Comet } from "./Comet";

export default function Scene() {
  const [dpr, setDpr] = useState(1.25);
  const started = useStore((st) => st.started);
  return (
    <Canvas
      className="canvas"
      dpr={dpr}
      camera={{ position: [0, 21000, 0], fov: 50, near: 0.05, far: 3_000_000 }}
      gl={{ antialias: true, logarithmicDepthBuffer: true, powerPreference: "high-performance" }}
      onPointerMissed={(e) => {
        if (e.detail === 2) store.set({ selected: null });
      }}
    >
      <color attach="background" args={["#03061a"]} />
      <ambientLight intensity={0.07} />
      <PerformanceMonitor
        bounds={() => [45, 58]}
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(1.5, d + 0.25))}
        flipflops={4}
        onFallback={() => setDpr(1)}
      />
      <SimClock />

      <Starfield />
      <DistantGalaxies />
      <Galaxy />

      <Sun />
      {PLANETS.map((p) => (
        <Planet key={p.id} data={p} />
      ))}
      <Comet />
      <AsteroidBelt />
      <KuiperBelt />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.6} maxDistance={900_000} zoomSpeed={1.1} autoRotate={!started} autoRotateSpeed={0.35} />
      <CameraRig />
      <LabelProjector />

    </Canvas>
  );
}
