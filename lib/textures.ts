"use client";

import * as THREE from "three";
import type { TextureKind } from "./bodies";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createNoise(seed: number) {
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const hash = (x: number, y: number, z: number) => perm[perm[perm[x & 255] + (y & 255)] + (z & 255)] / 255;
  const fade = (t: number) => t * t * (3 - 2 * t);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  function noise(x: number, y: number, z: number) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = fade(xf), v = fade(yf), w = fade(zf);
    const x0 = lerp(hash(xi, yi, zi), hash(xi + 1, yi, zi), u);
    const x1 = lerp(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u);
    const x2 = lerp(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u);
    const x3 = lerp(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u);
    return lerp(lerp(x0, x1, v), lerp(x2, x3, v), w);
  }

  function fbm(x: number, y: number, z: number, octaves = 5) {
    let value = 0, amp = 0.5, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
      value += amp * noise(x * freq + i * 17.3, y * freq, z * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.02;
    }
    return value / norm;
  }

  return { noise, fbm };
}

type RGB = [number, number, number];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

function gradient(stops: [number, RGB][], t: number): RGB {
  t = clamp01(t);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [p0, c0] = stops[i - 1];
      const [p1, c1] = stops[i];
      return mix(c0, c1, (t - p0) / (p1 - p0));
    }
  }
  return stops[stops.length - 1][1];
}

type Painter = (x: number, y: number, z: number, u: number) => [number, number, number, number];

function paint(width: number, height: number, painter: Painter) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const d = img.data;
  for (let j = 0; j < height; j++) {
    const phi = ((j + 0.5) / height) * Math.PI;
    const sinPhi = Math.sin(phi);
    const y = Math.cos(phi);
    for (let i = 0; i < width; i++) {
      const u = (i + 0.5) / width;
      const theta = u * Math.PI * 2;
      const x = sinPhi * Math.cos(theta);
      const z = sinPhi * Math.sin(theta);
      const [r, g, b, a] = painter(x, y, z, u);
      const k = (j * width + i) * 4;
      d[k] = clamp01(r) * 255;
      d[k + 1] = clamp01(g) * 255;
      d[k + 2] = clamp01(b) * 255;
      d[k + 3] = clamp01(a) * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const painters: Record<Exclude<TextureKind, "rock">, (seed: number) => Painter> = {
  mercury: (seed) => {
    const { fbm, noise } = createNoise(seed);
    return (x, y, z) => {
      const n = fbm(x * 4, y * 4, z * 4, 6);
      const crater = Math.pow(1 - Math.abs(noise(x * 14, y * 14, z * 14) * 2 - 1), 6);
      const c = gradient([[0, [0.28, 0.27, 0.26]], [0.5, [0.52, 0.5, 0.47]], [1, [0.72, 0.7, 0.66]]], n + crater * 0.25 - 0.1);
      return [...c, 1];
    };
  },
  venus: (seed) => {
    const { fbm } = createNoise(seed);
    return (x, y, z) => {
      const warp = fbm(x * 3, y * 3, z * 3, 4);
      const n = fbm(x * 1.5 + warp, y * 7 + warp * 2, z * 1.5, 5);
      const c = gradient([[0, [0.72, 0.52, 0.28]], [0.5, [0.9, 0.76, 0.5]], [1, [0.98, 0.92, 0.75]]], n);
      return [...c, 1];
    };
  },
  earth: (seed) => {
    const { fbm } = createNoise(seed);
    return (x, y, z) => {
      const h = fbm(x * 2.2, y * 2.2, z * 2.2, 6);
      const lat = Math.abs(y);
      const ice = smooth(0.82, 0.9, lat + (fbm(x * 6, y * 6, z * 6, 3) - 0.5) * 0.15);
      let c: RGB;
      if (h < 0.52) {
        c = gradient([[0, [0.02, 0.07, 0.25]], [0.8, [0.04, 0.2, 0.48]], [1, [0.12, 0.4, 0.6]]], h / 0.52);
      } else {
        const t = (h - 0.52) / 0.48;
        const dry = fbm(x * 5 + 3, y * 5, z * 5, 4);
        const veg: RGB = mix([0.13, 0.36, 0.12], [0.62, 0.52, 0.32], smooth(0.4, 0.65, dry + (0.3 - lat) * 0.6));
        c = mix(veg, [0.45, 0.38, 0.3], smooth(0.35, 0.9, t));
      }
      c = mix(c, [0.93, 0.95, 0.98], ice);
      return [...c, 1];
    };
  },
  mars: (seed) => {
    const { fbm } = createNoise(seed);
    return (x, y, z) => {
      const n = fbm(x * 3, y * 3, z * 3, 6);
      const dark = smooth(0.42, 0.32, fbm(x * 1.6 + 5, y * 1.6, z * 1.6, 4));
      let c = gradient([[0, [0.45, 0.18, 0.08]], [0.5, [0.74, 0.36, 0.17]], [1, [0.88, 0.56, 0.33]]], n);
      c = mix(c, [0.3, 0.14, 0.08], dark * 0.7);
      const cap = smooth(0.9, 0.95, Math.abs(y) + (n - 0.5) * 0.08);
      c = mix(c, [0.95, 0.93, 0.9], cap);
      return [...c, 1];
    };
  },
  jupiter: (seed) => {
    const { fbm } = createNoise(seed);
    const spotLat = -Math.sin((22 * Math.PI) / 180);
    const spotDir = new THREE.Vector3(Math.cos(1.2), 0, Math.sin(1.2)).multiplyScalar(Math.sqrt(1 - spotLat * spotLat));
    spotDir.y = spotLat;
    return (x, y, z) => {
      const turb = fbm(x * 4, y * 4, z * 4, 5);
      const band = Math.sin(y * Math.PI * 7.5 + turb * 2.2) * 0.5 + 0.5;
      const fine = fbm(x * 2, y * 30, z * 2, 3);
      let c = gradient(
        [[0, [0.55, 0.38, 0.26]], [0.35, [0.78, 0.6, 0.44]], [0.65, [0.93, 0.86, 0.74]], [1, [0.98, 0.95, 0.88]]],
        band * 0.8 + fine * 0.3,
      );
      const dx = x - spotDir.x, dy = (y - spotDir.y) * 2.2, dz = z - spotDir.z;
      const spot = smooth(0.16, 0.05, Math.sqrt(dx * dx + dy * dy + dz * dz) + (turb - 0.5) * 0.04);
      c = mix(c, [0.75, 0.33, 0.2], spot * 0.9);
      return [...c, 1];
    };
  },
  saturn: (seed) => {
    const { fbm } = createNoise(seed);
    return (x, y, z) => {
      const turb = fbm(x * 3, y * 3, z * 3, 4);
      const band = Math.sin(y * Math.PI * 9 + turb * 0.8) * 0.5 + 0.5;
      const c = gradient([[0, [0.72, 0.6, 0.4]], [0.5, [0.87, 0.77, 0.56]], [1, [0.96, 0.9, 0.74]]], band * 0.7 + fbm(x, y * 25, z, 3) * 0.3);
      return [...c, 1];
    };
  },
  uranus: (seed) => {
    const { fbm } = createNoise(seed);
    return (x, y, z) => {
      const band = Math.sin(y * Math.PI * 5 + fbm(x * 2, y * 2, z * 2, 3)) * 0.5 + 0.5;
      const c = mix([0.55, 0.8, 0.84], [0.68, 0.9, 0.92], band * 0.4 + fbm(x * 3, y * 12, z * 3, 3) * 0.2);
      return [...c, 1];
    };
  },
  neptune: (seed) => {
    const { fbm } = createNoise(seed);
    return (x, y, z) => {
      const turb = fbm(x * 3, y * 3, z * 3, 4);
      const band = Math.sin(y * Math.PI * 6 + turb * 1.5) * 0.5 + 0.5;
      let c = gradient([[0, [0.12, 0.2, 0.62]], [0.6, [0.22, 0.38, 0.85]], [1, [0.45, 0.62, 0.95]]], band * 0.6 + fbm(x * 2, y * 18, z * 2, 3) * 0.4);
      const dx = x - 0.75, dy = (y + 0.35) * 2, dz = z - 0.4;
      const spot = smooth(0.18, 0.06, Math.sqrt(dx * dx + dy * dy + dz * dz));
      c = mix(c, [0.06, 0.1, 0.35], spot * 0.8);
      return [...c, 1];
    };
  },
};

const cache = new Map<string, THREE.Texture>();

function cached<T extends THREE.Texture>(key: string, build: () => T): T {
  let tex = cache.get(key) as T | undefined;
  if (!tex) {
    tex = build();
    cache.set(key, tex);
  }
  return tex;
}

export function createPlanetTexture(kind: TextureKind, seed = 1, base: RGB = [0.6, 0.6, 0.6]) {
  return cached(`planet:${kind}:${seed}:${base.join(",")}`, () => buildPlanetTexture(kind, seed, base));
}

function buildPlanetTexture(kind: TextureKind, seed: number, base: RGB) {
  const big = kind === "earth" || kind === "jupiter";
  const w = big ? 1024 : 512;
  if (kind === "rock") {
    const { fbm, noise } = createNoise(seed);
    return paint(256, 128, (x, y, z) => {
      const n = fbm(x * 4, y * 4, z * 4, 5);
      const crater = Math.pow(1 - Math.abs(noise(x * 10, y * 10, z * 10) * 2 - 1), 6);
      const k = 0.65 + (n - 0.5) * 0.9 + crater * 0.15;
      return [base[0] * k, base[1] * k, base[2] * k, 1];
    });
  }
  return paint(w, w / 2, painters[kind](seed));
}

export function createCloudTexture(seed = 7) {
  return cached(`clouds:${seed}`, () => buildCloudTexture(seed));
}

function buildCloudTexture(seed: number) {
  const { fbm } = createNoise(seed);
  return paint(1024, 512, (x, y, z) => {
    const warp = fbm(x * 2, y * 2, z * 2, 2);
    const n = fbm(x * 3 + warp * 1.5, y * 5 + warp, z * 3, 5);
    const a = smooth(0.5, 0.72, n) * 0.9;
    return [1, 1, 1, a];
  });
}

export function createRingTexture(tint: RGB, seed = 3) {
  return cached(`ring:${tint.join(",")}:${seed}`, () => buildRingTexture(tint, seed));
}

function buildRingTexture(tint: RGB, seed: number) {
  const { noise } = createNoise(seed);
  const w = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = 4;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, 4);
  for (let i = 0; i < w; i++) {
    const t = i / w;
    let a = 0.35 + noise(t * 80, 0, 0) * 0.45 + noise(t * 300, 1, 0) * 0.2;
    a *= 1 - smooth(0.6, 0.62, t) * smooth(0.68, 0.66, t) * 0.9;
    a *= smooth(0, 0.05, t) * smooth(1, 0.94, t);
    const k = 0.8 + noise(t * 40, 2, 0) * 0.3;
    for (let j = 0; j < 4; j++) {
      const idx = (j * w + i) * 4;
      img.data[idx] = clamp01(tint[0] * k) * 255;
      img.data[idx + 1] = clamp01(tint[1] * k) * 255;
      img.data[idx + 2] = clamp01(tint[2] * k) * 255;
      img.data[idx + 3] = clamp01(a) * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRadialTexture(stops: [number, string][], size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDistantGalaxyTexture(seed: number) {
  return cached(`galaxy:${seed}`, () => buildDistantGalaxyTexture(seed));
}

function buildDistantGalaxyTexture(seed: number) {
  const rand = mulberry32(seed);
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.globalCompositeOperation = "lighter";
  const core = ctx.createRadialGradient(128, 128, 0, 128, 128, 60);
  core.addColorStop(0, "rgba(255,240,215,0.9)");
  core.addColorStop(0.3, "rgba(255,220,180,0.35)");
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);
  const elliptical = rand() < 0.3;
  const arms = 2 + Math.floor(rand() * 2);
  const hue = rand();
  for (let i = 0; i < 2500; i++) {
    const r = Math.pow(rand(), 0.7) * 115;
    let a: number;
    if (elliptical) a = rand() * Math.PI * 2;
    else a = (Math.floor(rand() * arms) / arms) * Math.PI * 2 + r * 0.045 + (rand() - 0.5) * 0.5;
    const x = 128 + Math.cos(a) * r;
    const y = 128 + Math.sin(a) * r;
    const blue = hue > 0.5 ? 255 : 220;
    ctx.fillStyle = `rgba(${200 + rand() * 55},${200 + rand() * 40},${blue},${0.15 + rand() * 0.25})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
