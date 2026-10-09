"use client";

import dynamic from "next/dynamic";
import { Hud } from "./ui/Hud";

const Scene = dynamic(() => import("./scene/Scene"), {
  ssr: false,
  loading: () => <div className="loading">Sterne werden gesetzt …</div>,
});

export default function Experience() {
  return (
    <>
      <Scene />
      <Hud />
    </>
  );
}
