/**
 * Réglages de l'entreprise. Tout ce qui est marqué « À COMPLÉTER » doit être
 * remplacé par vos vraies informations avant la mise en ligne
 * (obligations légales : LCEN art. 6-III, RGPD art. 13).
 */
export const brand = {
  name: "AxynWeb",
  tagline: "Des sites à couper le souffle. Sécurisés, accompagnés, à prix juste.",
  email: "contact@axynweb.fr",
  phone: "", // À COMPLÉTER
  legal: {
    companyName: "À COMPLÉTER — raison sociale",
    legalForm: "À COMPLÉTER — forme juridique (EI, SASU, SARL…)",
    siret: "À COMPLÉTER — SIRET",
    vat: "À COMPLÉTER — n° TVA intracommunautaire ou mention de franchise",
    address: "À COMPLÉTER — adresse du siège",
    director: "À COMPLÉTER — directeur de la publication",
    host: "À COMPLÉTER — nom, adresse et téléphone de l'hébergeur (UE)",
    dpoEmail: "contact@axynweb.fr",
  },
};

/** Tarifs indicatifs : à ajuster. Utilisés par la page d'accueil et le simulateur. */
export const pricing = {
  offers: [
    {
      id: "essentiel",
      name: "Essentiel",
      price: 149,
      description: "Un site une page, basé sur un de nos modèles 3D.",
      features: [
        "Modèle 3D animé au choix",
        "Textes et couleurs adaptés à votre marque",
        "Espace client inclus",
        "En ligne en 72 h",
      ],
    },
    {
      id: "signature",
      name: "Signature",
      price: 349,
      featured: true,
      description: "Jusqu'à 5 pages, modèle retravaillé à votre image.",
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
      description: "Un site unique, généré et affiné à partir de votre brief.",
      features: [
        "Design original, sans modèle",
        "Pages illimitées",
        "Animations sur-mesure",
        "Accompagnement dédié",
      ],
    },
  ],
  maintenanceMonthly: 19,
  simulator: {
    // Tarif dégressif : la 1re page est dans la base, la 2e coûte moins cher que les suivantes.
    base: 149,
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
