/**
 * Référencement : adresse publique du site, zone desservie et données structurées (schema.org).
 * Tout ce qui est affiché aux moteurs vient d'ici ou de config.ts : aucune information inventée
 * (pas d'avis, pas de note, pas de client fictif). Les champs vides de config.ts sont omis.
 */
import { brand, pricing } from "@/lib/config";

/** Adresse publique de la plateforme, sans « / » final. Réglage : SITE_URL. */
export const siteUrl = (process.env.SITE_URL || "https://axynweb.fr").replace(/\/+$/, "");

export const absoluteUrl = (path = "/") => siteUrl + (path.startsWith("/") ? path : `/${path}`);

/** Zone desservie, reprise dans les textes, les balises et les données structurées. */
export const area = {
  city: "Le Rheu",
  mainCity: "Rennes",
  region: "Bretagne",
  department: "Ille-et-Vilaine",
  postalCode: "35650",
};

export const seoDescription =
  `Création de sites internet à ${area.mainCity} et partout en France : sites vitrines modernes avec fond 3D, ` +
  `sécurisés par un étudiant ingénieur en cybersécurité, en ligne en 72 h dès ${pricing.offers[0].price} €. Espace client inclus.`;

const orgId = absoluteUrl("/#organisation");

/** Le studio : entreprise locale de services, identifiée par un @id réutilisé par les autres blocs. */
export function organizationLd() {
  return {
    "@type": "ProfessionalService",
    "@id": orgId,
    name: brand.name,
    url: siteUrl,
    logo: absoluteUrl("/logo/axynweb-logo.svg"),
    image: absoluteUrl("/opengraph-image"),
    description: seoDescription,
    slogan: brand.tagline,
    email: brand.email,
    ...(brand.phone ? { telephone: brand.phone } : {}),
    ...(brand.legal.siret ? { taxID: brand.legal.siret } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: brand.legal.address.split(",")[0].trim(),
      addressLocality: area.city,
      postalCode: area.postalCode,
      addressRegion: area.region,
      addressCountry: "FR",
    },
    areaServed: [
      { "@type": "City", name: area.mainCity },
      { "@type": "AdministrativeArea", name: area.department },
      { "@type": "AdministrativeArea", name: area.region },
      { "@type": "Country", name: "France" },
    ],
    priceRange: `${pricing.offers[0].price} € – ${pricing.offers[pricing.offers.length - 1].price} €+`,
    knowsAbout: ["Création de site internet", "Site vitrine", "Référencement naturel (SEO)", "Cybersécurité web", "WebGL / 3D", "RGPD"],
    makesOffer: pricing.offers.map((o) => ({
      "@type": "Offer",
      name: `Site ${o.name}`,
      description: o.description,
      price: o.price,
      priceCurrency: "EUR",
      ...(o.from ? { priceSpecification: { "@type": "PriceSpecification", minPrice: o.price, priceCurrency: "EUR" } } : {}),
      url: absoluteUrl("/#tarifs"),
    })),
  };
}

export function websiteLd() {
  return { "@type": "WebSite", "@id": absoluteUrl("/#site"), url: siteUrl, name: brand.name, inLanguage: "fr-FR", publisher: { "@id": orgId } };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Fil d'Ariane : [libellé, chemin] depuis l'accueil (exclu). */
export function breadcrumbLd(trail: [string, string][]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Accueil", "/"] as [string, string], ...trail].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}

export function serviceLd(name: string, description: string, path: string, audience: string) {
  return {
    "@type": "Service",
    name,
    description,
    url: absoluteUrl(path),
    serviceType: "Création de site internet",
    provider: { "@id": orgId },
    areaServed: [{ "@type": "City", name: area.mainCity }, { "@type": "Country", name: "France" }],
    audience: { "@type": "BusinessAudience", audienceType: audience },
    offers: { "@type": "Offer", price: pricing.offers[0].price, priceCurrency: "EUR", url: absoluteUrl("/#tarifs") },
  };
}

/**
 * Open Graph d'une page. Un objet openGraph posé par une page remplace celui du layout en entier
 * (image comprise) : on repart donc toujours de cette base.
 */
export const openGraph = (path: string, extra: { title?: string; description?: string } = {}) => ({
  type: "website" as const,
  locale: "fr_FR",
  siteName: brand.name,
  url: path,
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${brand.name} — création de site internet à ${area.mainCity}` }],
  ...extra,
});
