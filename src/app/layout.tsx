import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PosyanduAI — Asisten Kader Posyandu, bertenaga MiMo",
  description:
    "AI assistant for Indonesia's 1.5M Posyandu kaders. Photo screening, voice complaints, voice replies — powered by Xiaomi MiMo (V2.5 Pro + VL + ASR + TTS).",
  manifest: "/manifest.json",
  applicationName: "PosyanduAI",
  appleWebApp: { capable: true, title: "PosyanduAI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2D7DD2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
