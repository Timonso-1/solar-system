"use client";

import { useEffect, useState } from "react";
import { DAY_MS, HALLEY, J2000_MS, PLANETS, SUN, type PlanetData } from "@/lib/bodies";
import { halleyAt } from "@/lib/orbits";
import {
  labelEls,
  resetToNow,
  select,
  setView,
  sim,
  startJourney,
  store,
  useStore,
  type View,
} from "@/lib/store";
import { LogoMark, Wordmark } from "./Logo";

const nf = (n: number, d = 0) => n.toLocaleString("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d });

const MIN_EXP = -2;
const MAX_EXP = 2.6;
const TOUR_MS = 9000;
const EARTH_KM = 12_756;
const LIGHT_SECONDS_PER_AU = 499.005;

const BODY_COLORS: Record<string, string> = {
  sun: "#f0c46c",
  mercury: "#a39d97",
  venus: "#e0bf86",
  earth: "#5a96e6",
  mars: "#d4693d",
  jupiter: "#d9ad7c",
  saturn: "#e8cf93",
  uranus: "#93d6de",
  neptune: "#5576e4",
  pluto: "#c2ad93",
  halley: "#7fd3c4",
};

interface LadderItem {
  id: string;
  name: string;
  au: string;
  diameterKm: number;
}

const LADDER: LadderItem[] = [
  { id: SUN.id, name: SUN.name, au: "0", diameterKm: SUN.diameterKm },
  ...PLANETS.map((p) => ({ id: p.id, name: p.name, au: nf(p.distanceAU, p.distanceAU < 10 ? 2 : 1), diameterKm: p.diameterKm })),
  { id: HALLEY.id, name: HALLEY.name, au: "0,6–35", diameterKm: 11 },
];

const TOUR_ORDER = LADDER.map((b) => b.id);

function fmtSpeed(days: number) {
  const a = Math.abs(days);
  if (a < 1 / 24) return `${nf(a * 1440)} min/s`;
  if (a < 1) return `${nf(a * 24, 1)} Std./s`;
  if (a < 365.25) return `${nf(a, a < 10 ? 1 : 0)} Tage/s`;
  return `${nf(a / 365.25, 1)} Jahre/s`;
}

function fmtDuration(days: number) {
  const a = Math.abs(days);
  if (a < 2) return `${nf(a * 24, 1)} Stunden`;
  if (a < 800) return `${nf(a, 1)} Tage`;
  return `${nf(a / 365.25, 1)} Jahre`;
}

function fmtLight(au: number) {
  const s = au * LIGHT_SECONDS_PER_AU;
  if (s < 3600) return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}

function useTicker<T>(read: () => T, ms = 150) {
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    const id = setInterval(() => setValue(read()), ms);
    return () => clearInterval(id);
  }, [read, ms]);
  return value;
}

const readDate = () =>
  new Date(J2000_MS + sim.days * DAY_MS).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const readHalleyDistance = () => halleyAt(sim.days).length();

function jumpToHalleyReturn() {
  const periDays = (HALLEY.perihelionMs - J2000_MS) / DAY_MS;
  sim.days = periDays + HALLEY.periodDays - 40;
  store.set({ speed: 1, paused: false });
}

function Icon({ name }: { name: "play" | "pause" | "reverse" | "forward" | "close" }) {
  const paths = {
    play: "M8 5.5v13l10.5-6.5z",
    pause: "M7.5 5.5h3.2v13H7.5zM13.3 5.5h3.2v13h-3.2z",
    reverse: "M11 6.5v11L3.5 12zM20.5 6.5v11L13 12z",
    forward: "M13 6.5v11l7.5-5.5zM3.5 6.5v11L11 12z",
    close: "M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
  };
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path d={paths[name]} fill="currentColor" />
    </svg>
  );
}

function Intro() {
  const started = useStore((s) => s.started);
  useEffect(() => {
    if (started) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") startJourney();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);

  return (
    <div className={`intro${started ? " intro--gone" : ""}`} aria-hidden={started}>
      <div className="intro__inner">
        <LogoMark size={112} animated />
        <h1 className="intro__title">Perihel</h1>
        <p className="intro__lead">
          Ein begehbares Modell unseres Sonnensystems. Fliege zu jedem Planeten, spule die Zeit vor und zurück und zoome
          hinaus bis zu den fernen Galaxien.
        </p>
        <button className="intro__cta" onClick={startJourney} tabIndex={started ? -1 : 0}>
          Reise beginnen
        </button>
        <p className="intro__note">Größen und Abstände sind gestaucht, damit alles auf einen Bildschirm passt.</p>
      </div>
    </div>
  );
}

const VIEWS: { id: View; label: string }[] = [
  { id: "system", label: "Sonnensystem" },
  { id: "galaxy", label: "Milchstraße" },
  { id: "universe", label: "Universum" },
];

function Header() {
  const view = useStore((s) => s.view);
  const selected = useStore((s) => s.selected);
  const touring = useStore((s) => s.touring);
  return (
    <header className="header">
      <div className="brand">
        <LogoMark size={34} />
        <Wordmark />
      </div>
      <nav className="tabs" aria-label="Ansicht">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={`tab${view === v.id && !selected ? " tab--on" : ""}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>
      <button
        className={`tour-btn${touring ? " tour-btn--on" : ""}`}
        onClick={() => {
          if (touring) store.set({ touring: false });
          else {
            store.set({ touring: true });
            select(TOUR_ORDER[0], true);
          }
        }}
      >
        <span className="tour-btn__ring" aria-hidden />
        {touring ? "Rundflug beenden" : "Rundflug starten"}
      </button>
    </header>
  );
}

function OrbitLadder() {
  const selected = useStore((s) => s.selected);
  return (
    <nav className="ladder" aria-label="Himmelskörper nach Sonnenabstand">
      <div className="ladder__head">
        <span>Körper</span>
        <span>AE</span>
      </div>
      <ol className="ladder__list">
        {LADDER.map((b, i) => {
          const size = Math.max(3, 4 + 3.1 * Math.log10(b.diameterKm / 1000));
          return (
            <li key={b.id}>
              <button
                className={`ladder__item${selected === b.id ? " ladder__item--on" : ""}`}
                onClick={() => select(b.id)}
                title={i <= 9 ? `Taste ${i}` : undefined}
              >
                <span className="ladder__dot-slot">
                  <span
                    className="ladder__dot"
                    style={{ width: size, height: size, background: BODY_COLORS[b.id], color: BODY_COLORS[b.id] }}
                  />
                </span>
                <span className="ladder__name">{b.name}</span>
                <span className="ladder__au">{b.au}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

function SizeCompare({ id, name, diameterKm }: { id: string; name: string; diameterKm: number }) {
  if (id === "earth") return null;
  const ratio = diameterKm / EARTH_KM;
  let rEarth = 14;
  let rBody = rEarth * ratio;
  if (rBody > 30) {
    rEarth = (rEarth * 30) / rBody;
    rBody = 30;
  }
  rEarth = Math.max(rEarth, 0.9);
  const h = 66;
  const cy = h / 2;
  const bodyX = 40;
  const earthX = bodyX + rBody + 16 + rEarth;
  return (
    <figure className="compare">
      <svg viewBox={`0 0 ${earthX + rEarth + 10} ${h}`} height={h} role="img" aria-label={`${name} im Größenvergleich zur Erde`}>
        <circle cx={bodyX} cy={cy} r={rBody} fill={BODY_COLORS[id]} />
        <circle cx={earthX} cy={cy} r={rEarth} fill={BODY_COLORS.earth} />
      </svg>
      <figcaption>
        {ratio >= 1
          ? `${nf(ratio, ratio < 10 ? 1 : 0)}-facher Erddurchmesser`
          : `${nf(ratio * 100)} % des Erddurchmessers`}
      </figcaption>
    </figure>
  );
}

function PanelHead({ title, kind, closable = true }: { title: string; kind: string; closable?: boolean }) {
  return (
    <div className="info__head">
      <div>
        <h2 className="info__title">{title}</h2>
        <p className="info__kind">{kind}</p>
      </div>
      {closable && (
        <button className="close" onClick={() => store.set({ selected: null, touring: false })} aria-label="Schließen">
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}

const VIEW_INFO: Record<Exclude<View, "system">, { title: string; kind: string; rows: [string, string][]; text: string }> = {
  galaxy: {
    title: "Milchstraße",
    kind: "Balkenspiralgalaxie",
    rows: [
      ["Durchmesser", "ca. 100.000 Lichtjahre"],
      ["Sterne", "ca. 100–400 Mrd."],
      ["Abstand Sonne–Zentrum", "ca. 26.000 Lichtjahre"],
      ["Umlauf der Sonne", "ca. 230 Mio. Jahre"],
      ["Zentrum", "Sagittarius A*"],
    ],
    text: "Die Sonne liegt im Orion-Arm, etwa auf halbem Weg zwischen Zentrum und Rand. Im Zentrum sitzt ein supermassereiches Schwarzes Loch.",
  },
  universe: {
    title: "Beobachtbares Universum",
    kind: "Galaxien, Haufen, Filamente",
    rows: [
      ["Alter", "ca. 13,8 Mrd. Jahre"],
      ["Durchmesser", "ca. 93 Mrd. Lichtjahre"],
      ["Galaxien", "Hunderte Mrd. bis ca. 2 Billionen"],
      ["Nächste große Galaxie", "Andromeda, ca. 2,5 Mio. Lj."],
    ],
    text: "Die Milchstraße ist eine von unzähligen Galaxien. Diese Ansicht ist symbolisch, reale Abstände wären hier nicht darstellbar.",
  },
};

function PlanetInfo({ p }: { p: PlanetData }) {
  return (
    <>
      <PanelHead title={p.name} kind={p.type} />
      <SizeCompare id={p.id} name={p.name} diameterKm={p.diameterKm} />
      <dl>
        <Row k="Durchmesser" v={`${nf(p.diameterKm)} km`} />
        <Row k="Abstand zur Sonne" v={`${nf(p.distanceAU, 2)} AE, ${nf(p.distanceAU * 149.6, 0)} Mio. km`} />
        <Row k="Sonnenlicht braucht" v={fmtLight(p.distanceAU)} />
        <Row k="Ein Jahr dauert" v={fmtDuration(p.orbitalPeriodDays)} />
        <Row k="Ein Tag dauert" v={fmtDuration(p.dayHours / 24)} />
        <Row k="Schwerkraft" v={`${nf(p.gravity, 1)} m/s², ${nf(p.gravity / 9.8, 2)}× Erde`} />
        <Row k="Achsneigung" v={`${nf(p.axialTiltDeg, 1)}°${p.rotationHours < 0 ? ", rückläufig" : ""}`} />
        <Row k="Monde" v={p.moons} />
        <Row k="Temperatur" v={p.temperature} />
      </dl>
      <p className="desc">{p.description}</p>
    </>
  );
}

function HalleyInfo() {
  const r = useTicker(readHalleyDistance, 200);
  return (
    <>
      <PanelHead title={`Komet ${HALLEY.name}`} kind={HALLEY.type} />
      <dl>
        <Row k="Aktueller Sonnenabstand" v={`${nf(r, 2)} AE`} />
        <Row k="Umlaufzeit" v="ca. 75 Jahre" />
        <Row k="Sonnennächster Punkt" v="0,59 AE" />
        <Row k="Sonnenfernster Punkt" v="ca. 35 AE" />
        <Row k="Letzter Periheldurchgang" v="9. Februar 1986" />
        <Row k="Nächste Wiederkehr" v="2061" />
        <Row k="Kern" v="ca. 15 × 8 km" />
      </dl>
      <p className="desc">{HALLEY.description}</p>
      <button className="jump" onClick={jumpToHalleyReturn}>
        Zur Wiederkehr 2061 springen
      </button>
    </>
  );
}

function SunInfo() {
  return (
    <>
      <PanelHead title={SUN.name} kind={SUN.type} />
      <SizeCompare id="sun" name={SUN.name} diameterKm={SUN.diameterKm} />
      <dl>
        <Row k="Durchmesser" v={`${nf(SUN.diameterKm)} km`} />
        <Row k="Temperatur" v={SUN.temperature} />
        <Row k="Alter" v="ca. 4,6 Mrd. Jahre" />
        <Row k="Licht bis zur Erde" v={fmtLight(1)} />
      </dl>
      <p className="desc">{SUN.description}</p>
    </>
  );
}

function InfoPanel() {
  const selected = useStore((s) => s.selected);
  const view = useStore((s) => s.view);
  const touring = useStore((s) => s.touring);

  let content: React.ReactNode = null;
  if (!selected) {
    if (view !== "system") {
      const info = VIEW_INFO[view];
      content = (
        <>
          <PanelHead title={info.title} kind={info.kind} closable={false} />
          <dl>
            {info.rows.map(([k, v]) => (
              <Row key={k} k={k} v={v} />
            ))}
          </dl>
          <p className="desc">{info.text}</p>
        </>
      );
    }
  } else if (selected === "sun") content = <SunInfo />;
  else if (selected === HALLEY.id) content = <HalleyInfo />;
  else {
    const p = PLANETS.find((x) => x.id === selected);
    if (p) content = <PlanetInfo p={p} />;
  }

  if (!content) return null;
  return (
    <section className="plate info" key={selected ?? view}>
      {touring && selected && <div className="info__progress" style={{ animationDuration: `${TOUR_MS}ms` }} />}
      {content}
    </section>
  );
}

function TimeControls() {
  const speed = useStore((s) => s.speed);
  const paused = useStore((s) => s.paused);
  const showOrbits = useStore((s) => s.showOrbits);
  const showLabels = useStore((s) => s.showLabels);
  const date = useTicker(readDate, 120);
  const sign = speed < 0 ? -1 : 1;
  const exp = Math.log10(Math.max(Math.abs(speed), 10 ** MIN_EXP));
  const slider = ((exp - MIN_EXP) / (MAX_EXP - MIN_EXP)) * 1000;

  return (
    <div className="plate controls">
      <div className="controls__top">
        <span className="date">{date}</span>
        <span className="speed">
          {sign < 0 ? "rückwärts, " : ""}
          {fmtSpeed(speed)}
        </span>
      </div>
      <div className="controls__row">
        <button
          className="icon-btn"
          aria-label={sign < 0 ? "Zeit vorwärts laufen lassen" : "Zeit rückwärts laufen lassen"}
          onClick={() => store.set({ speed: -speed })}
        >
          <Icon name={sign < 0 ? "forward" : "reverse"} />
        </button>
        <button
          className="icon-btn icon-btn--main"
          aria-label={paused ? "Fortsetzen" : "Anhalten"}
          onClick={() => store.set({ paused: !paused })}
        >
          <Icon name={paused ? "play" : "pause"} />
        </button>
        <input
          className="slider"
          type="range"
          min={0}
          max={1000}
          value={slider}
          aria-label="Geschwindigkeit der Zeit"
          style={{ ["--fill" as string]: `${slider / 10}%` }}
          onChange={(e) => {
            const v = Number(e.target.value) / 1000;
            store.set({ speed: sign * 10 ** (MIN_EXP + v * (MAX_EXP - MIN_EXP)) });
          }}
        />
      </div>
      <div className="controls__chips">
        <button className="chip" onClick={() => store.set({ speed: 1, paused: false })}>
          1 Tag/s
        </button>
        <button className="chip" onClick={resetToNow}>
          Heute
        </button>
        <span className="chips__gap" />
        <button
          className={`chip chip--toggle${showOrbits ? " chip--on" : ""}`}
          aria-pressed={showOrbits}
          onClick={() => store.set({ showOrbits: !showOrbits })}
        >
          Bahnen
        </button>
        <button
          className={`chip chip--toggle${showLabels ? " chip--on" : ""}`}
          aria-pressed={showLabels}
          onClick={() => store.set({ showLabels: !showLabels })}
        >
          Namen
        </button>
      </div>
    </div>
  );
}

function register(id: string) {
  return (el: HTMLElement | null) => {
    if (el) labelEls.set(id, el);
    else labelEls.delete(id);
  };
}

function Labels() {
  const labelBodies = [...PLANETS.map((p) => ({ id: p.id, name: p.name })), { id: HALLEY.id, name: HALLEY.name }];
  return (
    <div className="labels">
      {labelBodies.map((b) => (
        <div key={b.id} ref={register(b.id)} className="label-anchor" style={{ visibility: "hidden" }}>
          <button className="label" onClick={() => select(b.id)}>
            <span className="label__tick" style={{ background: BODY_COLORS[b.id] }} />
            {b.name}
          </button>
        </div>
      ))}
      <div ref={register("marker:milkyway")} className="label-anchor" style={{ visibility: "hidden" }}>
        <div className="marker">Milchstraße</div>
      </div>
      <div ref={register("marker:sun")} className="label-anchor label-anchor--sun" style={{ visibility: "hidden" }}>
        <div className="marker marker--sun">
          <span className="marker__dot" />
          Du bist hier
        </div>
      </div>
    </div>
  );
}

function useTour() {
  const touring = useStore((s) => s.touring);
  const selected = useStore((s) => s.selected);
  useEffect(() => {
    if (!touring) return;
    const id = setTimeout(() => {
      const i = TOUR_ORDER.indexOf(selected ?? "");
      select(TOUR_ORDER[(i + 1) % TOUR_ORDER.length], true);
    }, TOUR_MS);
    return () => clearTimeout(id);
  }, [touring, selected]);
}

export function Hud() {
  const started = useStore((s) => s.started);
  useTour();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!store.get().started) return;
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT" && (t as HTMLInputElement).type !== "range") return;
      if (e.code === "Space") {
        e.preventDefault();
        store.set({ paused: !store.get().paused });
      } else if (e.key === "Escape") {
        store.set({ selected: null, touring: false });
      } else if (/^[0-9]$/.test(e.key)) {
        select(TOUR_ORDER[Number(e.key)]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Labels />
      <div className={`hud${started ? "" : " hud--hidden"}`}>
        <Header />
        <OrbitLadder />
        <InfoPanel />
        <TimeControls />
        <p className="hint">Ziehen zum Drehen, Scrollen zum Zoomen. Tasten 0 bis 9 springen zu den Körpern, die Leertaste hält die Zeit an.</p>
      </div>
      <Intro />
    </>
  );
}
