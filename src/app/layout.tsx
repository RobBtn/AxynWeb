import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { headers } from "next/headers";
import { brand } from "@/lib/config";
import { area, seoDescription, siteUrl } from "@/lib/seo";
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
  metadataBase: new URL(siteUrl),
  title: {
    default: `Création de site internet à ${area.mainCity} — ${brand.name}, sites 3D sécurisés`,
    template: `%s — ${brand.name}`,
  },
  applicationName: brand.name,
  // Pas de canonique ici : elle serait héritée par toutes les pages. Chaque page publique pose la sienne.
  openGraph: { type: "website", locale: "fr_FR", siteName: brand.name },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  formatDetection: { telephone: false, email: false, address: false },
  // Icône d'onglet : version verte sur thème clair, version claire sur thème sombre.
  // favicon.ico et apple-icon.png (src/app) servent de repli pour les anciens navigateurs et iOS.
  icons: {
    icon: [
      { url: "/logo/axynweb-icone.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/logo/axynweb-icone-clair.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
  },
  description: seoDescription,
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
