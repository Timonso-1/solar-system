import * as THREE from "three";
import { GALAXY_RADIUS, SUN_GALACTIC_DISTANCE } from "./bodies";

export const GALAXY_TILT = THREE.MathUtils.degToRad(60);

const tiltQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), GALAXY_TILT);

export const GALACTIC_CENTER = new THREE.Vector3(-SUN_GALACTIC_DISTANCE, 0, 0).applyQuaternion(tiltQ);

export const GALACTIC_NORMAL = new THREE.Vector3(0, 1, 0).applyQuaternion(tiltQ);

export const VIEW_GOALS = {
  system: {
    target: new THREE.Vector3(0, 0, 0),
    dir: new THREE.Vector3(0, 0.45, 0.89).normalize(),
    dist: 250,
  },
  galaxy: {
    target: GALACTIC_CENTER.clone(),
    dir: GALACTIC_NORMAL.clone().multiplyScalar(0.85).add(new THREE.Vector3(0.15, 0, 0.5)).normalize(),
    dist: GALAXY_RADIUS * 2.1,
  },
  universe: {
    target: GALACTIC_CENTER.clone(),
    dir: new THREE.Vector3(0.55, 0.45, 0.7).normalize(),
    dist: 260_000,
  },
} as const;

export function seedFrom(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const LOGDEPTH = {
  vertPars: "#include <common>\n#include <logdepthbuf_pars_vertex>",
  vert: "#include <logdepthbuf_vertex>",
  fragPars: "#include <logdepthbuf_pars_fragment>",
  frag: "#include <logdepthbuf_fragment>",
};
