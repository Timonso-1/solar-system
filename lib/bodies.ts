export type TextureKind =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "rock";

export interface MoonData {
  id: string;
  name: string;
  diameterKm: number;
  distanceFactor: number;
  periodDays: number;
  color: [number, number, number];
}

export interface PlanetData {
  id: string;
  name: string;
  type: string;
  diameterKm: number;
  distanceAU: number;
  orbitalPeriodDays: number;
  rotationHours: number;
  axialTiltDeg: number;
  meanLongitudeJ2000: number;
  moons: string;
  temperature: string;
  description: string;
  texture: TextureKind;
  orbitColor: string;
  gravity: number;
  dayHours: number;
  inclinationDeg?: number;
  nodeDeg?: number;
  baseColor?: [number, number, number];
  ring?: { inner: number; outer: number; opacity: number; tint: [number, number, number] };
  moonList?: MoonData[];
}

export const SUN = {
  id: "sun",
  name: "Sonne",
  type: "Stern (G2V)",
  diameterKm: 1_392_700,
  temperature: "ca. 5.500 °C (Oberfläche)",
  description:
    "Die Sonne vereint rund 99,86 % der Masse des Sonnensystems. Ihre Energie entsteht durch Kernfusion von Wasserstoff zu Helium im Kern.",
};

export const PLANETS: PlanetData[] = [
  {
    id: "mercury",
    name: "Merkur",
    type: "Gesteinsplanet",
    diameterKm: 4_879,
    distanceAU: 0.387,
    orbitalPeriodDays: 87.97,
    rotationHours: 1407.6,
    axialTiltDeg: 0.034,
    meanLongitudeJ2000: 252.25,
    moons: "0",
    temperature: "167 °C (Mittel)",
    description:
      "Kleinster und sonnennächster Planet. Ohne nennenswerte Atmosphäre schwanken die Temperaturen zwischen etwa −180 °C und 430 °C.",
    texture: "mercury",
    gravity: 3.7,
    dayHours: 4222.6,
    orbitColor: "#9a9a9a",
  },
  {
    id: "venus",
    name: "Venus",
    type: "Gesteinsplanet",
    diameterKm: 12_104,
    distanceAU: 0.723,
    orbitalPeriodDays: 224.7,
    rotationHours: -5832.5,
    axialTiltDeg: 177.4,
    meanLongitudeJ2000: 181.98,
    moons: "0",
    temperature: "464 °C (Mittel)",
    description:
      "Dichte CO₂-Atmosphäre mit extremem Treibhauseffekt – heißester Planet des Sonnensystems. Rotiert rückläufig.",
    texture: "venus",
    gravity: 8.9,
    dayHours: 2802.0,
    orbitColor: "#d9b77a",
  },
  {
    id: "earth",
    name: "Erde",
    type: "Gesteinsplanet",
    diameterKm: 12_756,
    distanceAU: 1.0,
    orbitalPeriodDays: 365.26,
    rotationHours: 23.93,
    axialTiltDeg: 23.44,
    meanLongitudeJ2000: 100.46,
    moons: "1",
    temperature: "15 °C (Mittel)",
    description: "Der einzige bekannte Planet mit flüssigem Oberflächenwasser und Leben.",
    texture: "earth",
    gravity: 9.8,
    dayHours: 24.0,
    orbitColor: "#4f8fe0",
    moonList: [
      { id: "moon", name: "Mond", diameterKm: 3_475, distanceFactor: 2.6, periodDays: 27.32, color: [0.62, 0.62, 0.6] },
    ],
  },
  {
    id: "mars",
    name: "Mars",
    type: "Gesteinsplanet",
    diameterKm: 6_792,
    distanceAU: 1.524,
    orbitalPeriodDays: 686.98,
    rotationHours: 24.62,
    axialTiltDeg: 25.19,
    meanLongitudeJ2000: 355.45,
    moons: "2",
    temperature: "−65 °C (Mittel)",
    description:
      "Der Rote Planet. Eisenoxid färbt seine Oberfläche, Olympus Mons ist der höchste bekannte Vulkan im Sonnensystem.",
    texture: "mars",
    gravity: 3.7,
    dayHours: 24.7,
    orbitColor: "#d0643a",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "Gasriese",
    diameterKm: 142_984,
    distanceAU: 5.203,
    orbitalPeriodDays: 4332.6,
    rotationHours: 9.93,
    axialTiltDeg: 3.13,
    meanLongitudeJ2000: 34.4,
    moons: "≥ 95",
    temperature: "−110 °C (Wolkenobergrenze)",
    description:
      "Größter Planet – mehr als doppelt so massereich wie alle anderen Planeten zusammen. Der Große Rote Fleck ist ein jahrhundertealter Sturm.",
    texture: "jupiter",
    gravity: 23.1,
    dayHours: 9.9,
    orbitColor: "#d6a571",
    moonList: [
      { id: "io", name: "Io", diameterKm: 3_643, distanceFactor: 1.55, periodDays: 1.769, color: [0.9, 0.82, 0.45] },
      { id: "europa", name: "Europa", diameterKm: 3_122, distanceFactor: 1.95, periodDays: 3.551, color: [0.86, 0.8, 0.7] },
      { id: "ganymede", name: "Ganymed", diameterKm: 5_268, distanceFactor: 2.45, periodDays: 7.155, color: [0.6, 0.56, 0.5] },
      { id: "callisto", name: "Kallisto", diameterKm: 4_821, distanceFactor: 3.1, periodDays: 16.69, color: [0.42, 0.38, 0.33] },
    ],
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "Gasriese",
    diameterKm: 120_536,
    distanceAU: 9.537,
    orbitalPeriodDays: 10_759,
    rotationHours: 10.66,
    axialTiltDeg: 26.73,
    meanLongitudeJ2000: 49.94,
    moons: "≥ 274",
    temperature: "−140 °C (Wolkenobergrenze)",
    description:
      "Bekannt für sein ausgeprägtes Ringsystem aus Eis und Gestein. Seine mittlere Dichte ist geringer als die von Wasser.",
    texture: "saturn",
    gravity: 9.0,
    dayHours: 10.7,
    orbitColor: "#e3c98a",
    ring: { inner: 1.25, outer: 2.3, opacity: 0.9, tint: [0.93, 0.85, 0.68] },
    moonList: [
      { id: "titan", name: "Titan", diameterKm: 5_150, distanceFactor: 3.2, periodDays: 15.95, color: [0.85, 0.6, 0.3] },
    ],
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "Eisriese",
    diameterKm: 51_118,
    distanceAU: 19.19,
    orbitalPeriodDays: 30_685,
    rotationHours: -17.24,
    axialTiltDeg: 97.77,
    meanLongitudeJ2000: 313.23,
    moons: "≥ 28",
    temperature: "−195 °C (Wolkenobergrenze)",
    description: "Seine Rotationsachse liegt fast in der Bahnebene – Uranus „rollt“ praktisch um die Sonne.",
    texture: "uranus",
    gravity: 8.7,
    dayHours: 17.2,
    orbitColor: "#8fd3dc",
    ring: { inner: 1.6, outer: 2.0, opacity: 0.25, tint: [0.7, 0.8, 0.85] },
  },
  {
    id: "neptune",
    name: "Neptun",
    type: "Eisriese",
    diameterKm: 49_528,
    distanceAU: 30.07,
    orbitalPeriodDays: 60_190,
    rotationHours: 16.11,
    axialTiltDeg: 28.32,
    meanLongitudeJ2000: 304.88,
    moons: "≥ 16",
    temperature: "−200 °C (Wolkenobergrenze)",
    description: "Äußerster Planet mit den stärksten gemessenen Winden im Sonnensystem (über 2.000 km/h).",
    texture: "neptune",
    gravity: 11.0,
    dayHours: 16.1,
    orbitColor: "#4a6fe0",
    moonList: [
      { id: "triton", name: "Triton", diameterKm: 2_707, distanceFactor: 2.6, periodDays: -5.877, color: [0.78, 0.72, 0.7] },
    ],
  },
  {
    id: "pluto",
    name: "Pluto",
    type: "Zwergplanet",
    diameterKm: 2_376,
    distanceAU: 39.48,
    orbitalPeriodDays: 90_560,
    rotationHours: -153.3,
    axialTiltDeg: 122.5,
    meanLongitudeJ2000: 238.93,
    moons: "5",
    temperature: "−225 °C (Mittel)",
    description:
      "Seit 2006 als Zwergplanet eingestuft. Seine stark elliptische, um rund 17° geneigte Bahn führt ihn zeitweise näher an die Sonne als Neptun. Hier vereinfacht als geneigter Kreis dargestellt.",
    texture: "rock",
    gravity: 0.7,
    dayHours: 153.3,
    inclinationDeg: 17.14,
    nodeDeg: 110.3,
    baseColor: [0.8, 0.7, 0.6],
    orbitColor: "#b9a58c",
    moonList: [
      { id: "charon", name: "Charon", diameterKm: 1_212, distanceFactor: 3.2, periodDays: 6.387, color: [0.6, 0.58, 0.56] },
    ],
  },
];

export const HALLEY = {
  id: "halley",
  name: "Halley",
  type: "Periodischer Komet",
  semiMajorAU: 17.834,
  eccentricity: 0.96714,
  inclinationDeg: 162.26,
  nodeDeg: 58.42,
  periArgDeg: 111.33,
  perihelionMs: Date.UTC(1986, 1, 9, 11, 0, 0),
  periodDays: 75.32 * 365.25,
  description:
    "Der bekannteste periodische Komet. Er kehrt etwa alle 75 Jahre ins innere Sonnensystem zurück und läuft rückläufig um die Sonne. In Sonnennähe verdampft Eis und bildet den Schweif, der stets von der Sonne weg zeigt.",
};

export const SUN_RADIUS = 10;

export function scaleDistance(au: number) {
  return 16 + 20 * Math.pow(au, 0.6);
}

export function scaleRadius(km: number) {
  return 0.9 * Math.sqrt(km / 6371);
}

export function moonRadius(km: number) {
  return 0.55 * Math.sqrt(km / 6371);
}

export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
export const DAY_MS = 86_400_000;

export const GALAXY_RADIUS = 10_000;
export const SUN_GALACTIC_DISTANCE = 5_200;
