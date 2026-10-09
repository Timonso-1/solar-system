"use client";

import { useSyncExternalStore } from "react";
import type { Object3D } from "three";
import { DAY_MS, J2000_MS } from "./bodies";

export type View = "system" | "galaxy" | "universe";

export interface UIState {
  speed: number;
  paused: boolean;
  selected: string | null;
  showOrbits: boolean;
  showLabels: boolean;
  view: View;
  flyNonce: number;
  nearSystem: boolean;
  started: boolean;
  touring: boolean;
}

let state: UIState = {
  speed: 2,
  paused: false,
  selected: null,
  showOrbits: true,
  showLabels: true,
  view: "galaxy",
  flyNonce: 0,
  nearSystem: false,
  started: false,
  touring: false,
};

const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<UIState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useStore<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function select(id: string | null, fromTour = false) {
  store.set({
    selected: id,
    view: "system",
    flyNonce: state.flyNonce + 1,
    touring: fromTour ? state.touring : false,
  });
}

export function setView(view: View) {
  store.set({ view, selected: null, flyNonce: state.flyNonce + 1, touring: false });
}

export function startJourney() {
  store.set({ started: true, view: "system", selected: null, flyNonce: state.flyNonce + 1 });
}

export const sim = {
  days: (Date.now() - J2000_MS) / DAY_MS,
  spinDays: 0,
};

export function resetToNow() {
  sim.days = (Date.now() - J2000_MS) / DAY_MS;
}

export const bodies = new Map<string, { object: Object3D; radius: number }>();

export const labelEls = new Map<string, HTMLElement>();
