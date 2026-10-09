"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { bodies, sim, store, useStore } from "@/lib/store";
import { VIEW_GOALS } from "@/lib/space";

type Controls = { target: THREE.Vector3; update: () => void };

interface Flight {
  t: number;
  fromTarget: THREE.Vector3;
  fromDir: THREE.Vector3;
  fromDist: number;
  goalDir: THREE.Vector3;
  goalDist: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const tmp = new THREE.Vector3();
const goalTarget = new THREE.Vector3();
const lastBody = new THREE.Vector3();

export function SimClock() {
  useFrame((_, delta) => {
    const s = store.get();
    if (s.paused) return;
    const dt = Math.min(delta, 0.1);
    sim.days += s.speed * dt;
    sim.spinDays += Math.sign(s.speed) * Math.min(Math.abs(s.speed), 0.35) * dt;
  }, -2);
  return null;
}

export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const flyNonce = useStore((s) => s.flyNonce);
  const flight = useRef<Flight | null>(null);
  const following = useRef(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!controls) return;
    const s = store.get();
    if (!initialized.current) {
      initialized.current = true;
      const g = VIEW_GOALS[s.view];
      controls.target.copy(g.target);
      camera.position.copy(g.target).addScaledVector(g.dir, g.dist);
      controls.update();
      return;
    }
    const fromTarget = controls.target.clone();
    const offset = camera.position.clone().sub(fromTarget);
    const fromDist = Math.max(offset.length(), 0.01);
    const fromDir = offset.clone().normalize();

    let goalDir: THREE.Vector3;
    let goalDist: number;
    if (s.selected) {
      const b = bodies.get(s.selected);
      if (!b) return;
      b.object.getWorldPosition(goalTarget);
      goalDir = camera.position.clone().sub(goalTarget).normalize();
      goalDir.y = Math.max(goalDir.y, 0.28);
      goalDir.normalize();
      goalDist = s.selected === "sun" ? 55 : Math.max(b.radius * 5.5, 3.5);
    } else {
      const g = VIEW_GOALS[s.view];
      goalDir = g.dir.clone();
      goalDist = g.dist;
    }
    flight.current = { t: 0, fromTarget, fromDir, fromDist, goalDir, goalDist };
    following.current = false;
  }, [flyNonce, controls, camera]);

  useFrame((_, delta) => {
    if (!controls) return;
    const s = store.get();
    const body = s.selected ? bodies.get(s.selected) : undefined;

    if (body) body.object.getWorldPosition(goalTarget);
    else goalTarget.copy(VIEW_GOALS[s.view].target);

    const f = flight.current;
    if (f) {
      const span = Math.abs(Math.log(f.goalDist / f.fromDist));
      f.t = Math.min(1, f.t + delta / (1.4 + Math.min(span, 8) * 0.18));
      const e = ease(f.t);
      controls.target.lerpVectors(f.fromTarget, goalTarget, e);
      const dir = tmp.lerpVectors(f.fromDir, f.goalDir, e);
      if (dir.lengthSq() < 1e-6) dir.copy(f.goalDir);
      dir.normalize();
      const dist = Math.exp(THREE.MathUtils.lerp(Math.log(f.fromDist), Math.log(f.goalDist), e));
      camera.position.copy(controls.target).addScaledVector(dir, dist);
      if (f.t >= 1) {
        flight.current = null;
        following.current = !!body;
        lastBody.copy(goalTarget);
      }
    } else if (body && following.current) {
      tmp.subVectors(goalTarget, lastBody);
      camera.position.add(tmp);
      controls.target.add(tmp);
      lastBody.copy(goalTarget);
    }

    const near = camera.position.length() < 4000;
    if (near !== s.nearSystem) store.set({ nearSystem: near });
  }, -1);

  return null;
}
