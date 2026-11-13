import type { NextConfig } from "next";

// En-têtes de sécurité appliqués à toutes les réponses.
// La Content-Security-Policy (avec nonce) et Strict-Transport-Security sont posés par src/proxy.ts :
// HSTS dépend du nom de domaine (plateforme ou domaine d'un client).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["imapflow", "mailparser"],
  // Envoi de photos par Server Action (5 Mo par photo, contrôlé dans src/lib/media.ts).
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Les « modèles » sont devenus des « exemples » : anciennes adresses redirigées (301) pour le référencement.
  async redirects() {
    return [
      { source: "/modeles", destination: "/exemples", permanent: true },
      { source: "/modeles/:id", destination: "/exemples/:id", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
