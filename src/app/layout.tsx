import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { headers } from "next/headers";
import { brand } from "@/lib/config";
import "./globals.css";

// Polices auto-hébergées par Next.js : aucune requête vers Google côté visiteur (RGPD).
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], axes: ["wdth"] });
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: `${brand.name} — Sites web 3D, sécurisés et accompagnés`, template: `%s — ${brand.name}` },
  description:
    "Studio de création de sites web. Des sites immersifs en 3D, relus et sécurisés par un étudiant ingénieur en cybersécurité, livrés en quelques jours à prix juste. Espace client inclus.",
};

export const viewport: Viewport = { themeColor: "#0c0d0a" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lecture des en-têtes : force un rendu par requête, indispensable pour que
  // Next.js applique le nonce de la Content-Security-Policy posée par proxy.ts.
  await headers();

  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${display.variable} ${serif.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
