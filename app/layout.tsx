import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perihel – Sonnensystem, Milchstraße, Universum",
  description:
    "Perihel ist ein begehbares 3D-Modell des Sonnensystems: Planeten, Monde, der Halleysche Komet, die Milchstraße und ferne Galaxien.",
};

export const viewport: Viewport = {
  themeColor: "#03061a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
