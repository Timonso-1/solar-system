import * as THREE from "three";
import { DAY_MS, HALLEY, J2000_MS, scaleDistance } from "./bodies";

const D2R = Math.PI / 180;
const PERI_DAYS = (HALLEY.perihelionMs - J2000_MS) / DAY_MS;

const cO = Math.cos(HALLEY.nodeDeg * D2R);
const sO = Math.sin(HALLEY.nodeDeg * D2R);
const cw = Math.cos(HALLEY.periArgDeg * D2R);
const sw = Math.sin(HALLEY.periArgDeg * D2R);
const ci = Math.cos(HALLEY.inclinationDeg * D2R);
const si = Math.sin(HALLEY.inclinationDeg * D2R);

function solveKepler(M: number, e: number) {
  let E = M + 0.85 * e * Math.sign(Math.sin(M) || 1);
  for (let i = 0; i < 40; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}

export function fromEccentricAnomaly(E: number, out: THREE.Vector3) {
  const a = HALLEY.semiMajorAU;
  const e = HALLEY.eccentricity;
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const X = (cO * cw - sO * sw * ci) * xp + (-cO * sw - sO * cw * ci) * yp;
  const Y = (sO * cw + cO * sw * ci) * xp + (-sO * sw + cO * cw * ci) * yp;
  const Z = sw * si * xp + cw * si * yp;
  return out.set(X, Z, -Y);
}

export function halleyAt(days: number, outAU = new THREE.Vector3()) {
  let M = ((2 * Math.PI * (days - PERI_DAYS)) / HALLEY.periodDays) % (2 * Math.PI);
  if (M > Math.PI) M -= 2 * Math.PI;
  if (M < -Math.PI) M += 2 * Math.PI;
  return fromEccentricAnomaly(solveKepler(M, HALLEY.eccentricity), outAU);
}

export function toScene(au: THREE.Vector3, out: THREE.Vector3) {
  const r = au.length();
  return out.copy(au).multiplyScalar(scaleDistance(r) / Math.max(r, 1e-6));
}

