/**
 * Réglages de l'entreprise. Les champs laissés vides ("") ne sont pas affichés
 * sur les pages légales : renseignez-les au fur et à mesure (statut, SIRET…).
 * Obligations d'information : LCEN art. 6-III, RGPD art. 13.
 */
export const brand = {
  name: "AxynWeb",
  tagline: "Votre site pro en 72 h, à petit prix. Rapide, sécurisé, sans mauvaise surprise.",
  email: "contact@axynweb.fr",
  phone: "",
  legal: {
    /** Raison sociale ou nom de l'entrepreneur ; vide : le nom de la marque est utilisé. */
    companyName: "",
    /** EI, SASU, SARL… */
    legalForm: "",
    siret: "",
    /** N° de TVA intracommunautaire, ou mention de franchise en base. */
    vat: "",
    address: "Rue le Ptit Cheval, Le Rheu",
    /** Directeur de la publication. */
    director: "",
    /** Hébergeur : nom, adresse et téléphone. */
    host: "Hostinger",
    /** Médiateur de la consommation : nom et coordonnées (obligatoire pour vendre aux consommateurs). */
    mediator: "",
    dpoEmail: "contact@axynweb.fr",
  },
};

/** Tarifs indicatifs : à ajuster. Utilisés par la page d'accueil et le simulateur. */
export const pricing = {
  offers: [
    {
      id: "essentiel",
      name: "Essentiel",
      price: 179,
      description: "Un site une page, unique et conçu pour votre activité.",
      features: [
        "Design personnalisé à votre image",
        "Fond 3D animé à vos couleurs",
        "Textes adaptés à votre métier",
        "Espace client inclus",
        "En ligne en 72 h",
      ],
    },
    {
      id: "signature",
      name: "Signature",
      price: 349,
      featured: true,
      description: "Jusqu'à 5 pages, un design plus poussé et une scène 3D créée pour vous.",
      features: [
        "Tout Essentiel",
        "Scène 3D personnalisée",
        "Jusqu'à 5 pages",
        "Référencement de base (SEO)",
        "2 séries de retouches",
      ],
    },
    {
      id: "sur-mesure",
      name: "Sur-mesure",
      price: 690,
      from: true,
      description: "Un projet ambitieux : pages et fonctions sans limite, à partir de votre brief.",
      features: [
        "Fonctions sur mesure (réservation, boutique…)",
        "Pages illimitées",
        "Animations sur-mesure",
        "Accompagnement dédié",
      ],
    },
  ],
  maintenanceMonthly: 19,
  simulator: {
    // Tarif dégressif : la 1re page est dans la base, la 2e coûte moins cher que les suivantes.
    base: 179,
    secondPage: 15,
    perPage: 30,
    options: [
      { id: "scene3d", label: "Scène 3D personnalisée", price: 90 },
      { id: "seo", label: "Référencement (SEO)", price: 60 },
      { id: "redaction", label: "Rédaction des textes", price: 45 },
      { id: "boutique", label: "Boutique / paiement en ligne", price: 220 },
      { id: "multilingue", label: "Version multilingue", price: 70 },
    ],
  },
};
