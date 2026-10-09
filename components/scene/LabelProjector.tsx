"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bodies, labelEls, store } from "@/lib/store";
import { GALACTIC_CENTER, GALACTIC_NORMAL } from "@/lib/space";

const world = new THREE.Vector3();
const ndc = new THREE.Vector3();
const MILKY_WAY_ANCHOR = GALACTIC_CENTER.clone().addScaledVector(GALACTIC_NORMAL, 1800);

export function LabelProjector() {
  useFrame(({ camera, size }) => {
    const s = store.get();
    labelEls.forEach((el, id) => {
      let visible: boolean;
      if (id === "marker:milkyway") {
        visible = s.view === "universe" && !s.selected;
        world.copy(MILKY_WAY_ANCHOR);
      } else if (id === "marker:sun") {
        visible = s.view === "galaxy" && !s.selected && !s.nearSystem;
        world.set(0, 0, 0);
      } else {
        const b = bodies.get(id);
        visible = !!b && s.showLabels && s.nearSystem && s.selected !== id;
        if (b) {
          b.object.getWorldPosition(world);
          world.y += b.radius + 1.1;
        }
      }
      if (visible) {
        ndc.copy(world).project(camera);
        visible = ndc.z < 1 && Math.abs(ndc.x) < 1.2 && Math.abs(ndc.y) < 1.2;
      }
      if (!visible) {
        if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
        return;
      }
      const x = (ndc.x * 0.5 + 0.5) * size.width;
      const y = (-ndc.y * 0.5 + 0.5) * size.height;
      el.style.visibility = "visible";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  });
  return null;
}
