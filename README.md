# Perihel

Ein begehbares 3D-Modell des Sonnensystems mit Milchstraße und Universum (Next.js 16, React Three Fiber, Three.js).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Inhalt

- Sonne, acht Planeten, Pluto, wichtige Monde, Ringe, Asteroiden- und Kuipergürtel
- Komet Halley auf echter Kepler-Bahn mit Schweif, der von der Sonne weg zeigt
- Milchstraße als Partikel-Spiralgalaxie, ferne Galaxien in der Universum-Ansicht
- Rundflug, Zeitsteuerung, Größenvergleich zur Erde, Lichtlaufzeit von der Sonne

## Struktur

- `lib/bodies.ts` Planetendaten (NASA Planetary Fact Sheet, gerundet), Bahnelemente Halley
- `lib/orbits.ts` Kepler-Lösung für den Kometen
- `lib/textures.ts` prozedurale Texturen, keine externen Assets
- `lib/store.ts` UI-Zustand und Simulationszeit
- `components/scene/*` 3D-Szene
- `components/ui/*` Logo, Intro, Bedienoberfläche

## Vereinfachungen

- Größen und Abstände sind nicht maßstabsgetreu.
- Planetenbahnen sind Kreise mit mittlerer Länge zur Epoche J2000, Pluto als geneigter Kreis.
- Eigenrotation und Monde laufen mit gedeckelter Geschwindigkeit und sind nicht datumsgenau.

## Tastatur

`0` bis `9` springen zu Sonne, Planeten und Pluto, `Leertaste` hält die Zeit an, `Esc` hebt die Auswahl auf, `Enter` startet im Intro.
