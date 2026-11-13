import type { ScenePreset } from "@/components/Scene3D";

/** Contenu éditable d'un site basé sur un modèle (identique pour tous les modèles). */
export type SiteContent = {
  brand: string;
  kicker: string;
  heroTitle: string;
  heroSubtitle: string;
  cta: string;
  aboutTitle: string;
  aboutText: string;
  s1Title: string;
  s1Text: string;
  s2Title: string;
  s2Text: string;
  s3Title: string;
  s3Text: string;
  quote: string;
  quoteAuthor: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  /** Photos : chemins internes /api/media/… (vide = cadre décoratif). */
  photoHero: string;
  photoAbout: string;
  photo1: string;
  photo2: string;
  photo3: string;
};

/** Champs présentés dans l'éditeur de l'espace client. */
export const contentFields: { key: keyof SiteContent; label: string; group: string; long?: boolean; max: number }[] = [
  { key: "brand", label: "Nom affiché", group: "Identité", max: 60 },
  { key: "kicker", label: "Sur-titre", group: "Accueil", max: 80 },
  { key: "heroTitle", label: "Grand titre", group: "Accueil", max: 120 },
  { key: "heroSubtitle", label: "Sous-titre", group: "Accueil", long: true, max: 300 },
  { key: "cta", label: "Texte du bouton", group: "Accueil", max: 40 },
  { key: "aboutTitle", label: "Titre de présentation", group: "Présentation", max: 120 },
  { key: "aboutText", label: "Texte de présentation", group: "Présentation", long: true, max: 900 },
  { key: "s1Title", label: "Bloc 1 — titre", group: "Prestations", max: 60 },
  { key: "s1Text", label: "Bloc 1 — texte", group: "Prestations", long: true, max: 300 },
  { key: "s2Title", label: "Bloc 2 — titre", group: "Prestations", max: 60 },
  { key: "s2Text", label: "Bloc 2 — texte", group: "Prestations", long: true, max: 300 },
  { key: "s3Title", label: "Bloc 3 — titre", group: "Prestations", max: 60 },
  { key: "s3Text", label: "Bloc 3 — texte", group: "Prestations", long: true, max: 300 },
  { key: "quote", label: "Citation / avis", group: "Témoignage", long: true, max: 300 },
  { key: "quoteAuthor", label: "Auteur de la citation", group: "Témoignage", max: 80 },
  { key: "email", label: "E-mail de contact", group: "Contact", max: 120 },
  { key: "phone", label: "Téléphone", group: "Contact", max: 30 },
  { key: "address", label: "Adresse", group: "Contact", max: 160 },
  { key: "hours", label: "Horaires d'ouverture", group: "Contact", long: true, max: 240 },
];

export type PhotoKey = "photoHero" | "photoAbout" | "photo1" | "photo2" | "photo3";

/** Emplacements photo présents dans chaque modèle. */
export const photoSlots: { key: PhotoKey; label: string }[] = [
  { key: "photoHero", label: "Photo principale" },
  { key: "photoAbout", label: "Photo de présentation" },
  { key: "photo1", label: "Galerie 1" },
  { key: "photo2", label: "Galerie 2" },
  { key: "photo3", label: "Galerie 3" },
];

/** Seuls les fichiers envoyés sur la plateforme sont acceptés comme photos. */
export const MEDIA_PATH = /^\/api\/media\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

const noPhotos = { photoHero: "", photoAbout: "", photo1: "", photo2: "", photo3: "" };

export type TemplateDef = {
  id: "aurore" | "monolithe" | "pulse" | "atelier" | "cabinet" | "clarte" | "ligne";
  name: string;
  sector: string;
  pitch: string;
  /** Fond 3D animé ; absent pour les exemples sobres, sans animation de fond. */
  scene?: ScenePreset;
  /** Couleurs du fond 3D, reprises par l'aperçu de l'espace client. */
  colors: [string, string, string];
  /** Opacité du fond 3D et type de fond (clair ou sombre). */
  sceneOpacity: number;
  light?: boolean;
  /** Légende des cadres photo tant qu'aucune photo n'est envoyée. */
  photoLabels: Record<PhotoKey, string>;
  /** Couleurs de l'aperçu (carte de la galerie). */
  preview: { bg: string; fg: string; accent: string };
  content: SiteContent;
};

export const templates: TemplateDef[] = [
  {
    id: "aurore",
    name: "Aurore",
    sector: "Restaurant · Hôtellerie",
    pitch: "Une étoffe de lumière chaude qui ondule derrière vos photos. Chaleureux, lent, gourmand.",
    scene: "silk",
    colors: ["#1c0b04", "#b4481a", "#ffd27a"],
    sceneOpacity: 0.7,
    photoLabels: { photoHero: "La salle", photoAbout: "Le chef", photo1: "Le feu", photo2: "L'assiette", photo3: "La cave" },
    preview: { bg: "#140a06", fg: "#fff1dc", accent: "#ff9b54" },
    content: {
      brand: "Maison Aurore",
      kicker: "Table de saison — Lyon",
      heroTitle: "La cuisine du feu et du temps",
      heroSubtitle:
        "Une carte courte, des produits de la région, une cuisson à la braise. Ouvert du mardi au samedi, midi et soir.",
      cta: "Réserver une table",
      aboutTitle: "Trois gestes, pas un de plus",
      aboutText:
        "Nous travaillons avec douze producteurs situés à moins de cent kilomètres. La carte change chaque semaine, selon ce qu'ils nous apportent. Rien n'est congelé, rien n'est caché.",
      s1Title: "Le déjeuner",
      s1Text: "Entrée, plat, dessert. Un menu unique qui suit le marché du matin.",
      s2Title: "Le dîner",
      s2Text: "Cinq temps autour de la braise, avec un accord de vins nature.",
      s3Title: "La table d'hôtes",
      s3Text: "Douze couverts face à la cuisine, pour vos soirées privées.",
      quote: "On vient pour le feu. On revient pour le silence qui suit la première bouchée.",
      quoteAuthor: "Un habitué",
      email: "bonjour@maison-aurore.example",
      phone: "04 00 00 00 00",
      address: "12 rue des Braises, 69001 Lyon",
      hours: "Mardi – samedi : 12 h – 14 h, 19 h 30 – 22 h. Fermé dimanche et lundi.",
      ...noPhotos,
    },
  },
  {
    id: "monolithe",
    name: "Monolithe",
    sector: "Architecte · Artisan · Bâtiment",
    pitch: "Un relief filaire, comme un plan qui prend vie. Grille stricte, typographie massive.",
    scene: "grid",
    colors: ["#a39c8c", "#3a3d44", "#ff5a1f"],
    sceneOpacity: 0.5,
    light: true,
    photoLabels: { photoHero: "Réalisation phare", photoAbout: "L'atelier", photo1: "Maison bois", photo2: "Extension", photo3: "Rénovation" },
    preview: { bg: "#e7e2d8", fg: "#111214", accent: "#ff5a1f" },
    content: {
      brand: "Atelier Monolithe",
      kicker: "Architecture & rénovation",
      heroTitle: "Bâtir peu. Bâtir juste.",
      heroSubtitle:
        "Maisons individuelles, extensions et réhabilitations. Nous dessinons des lieux sobres, durables, faits pour être habités longtemps.",
      cta: "Parler de votre projet",
      aboutTitle: "La matière avant la forme",
      aboutText:
        "Pierre, bois, chaux, terre crue. Chaque projet commence par le choix des matériaux et par le terrain. Le dessin vient ensuite, et il reste simple.",
      s1Title: "Conception",
      s1Text: "Esquisse, permis de construire, plans d'exécution.",
      s2Title: "Rénovation",
      s2Text: "Diagnostic, isolation, redistribution des volumes.",
      s3Title: "Suivi de chantier",
      s3Text: "Un seul interlocuteur, du premier coup de pioche à la remise des clés.",
      quote: "Ils ont enlevé tout ce qui était en trop. Il est resté notre maison.",
      quoteAuthor: "Claire et Julien, Annecy",
      email: "contact@atelier-monolithe.example",
      phone: "04 00 00 00 00",
      address: "3 quai de la Pierre, 74000 Annecy",
      hours: "Lundi – vendredi : 9 h – 18 h. Sur rendez-vous le samedi.",
      ...noPhotos,
    },
  },
  {
    id: "pulse",
    name: "Pulse",
    sector: "Coach · Salle de sport · Événement",
    pitch: "Une nappe de points néon qui roule vers l'horizon, des titres géants. De l'énergie pure.",
    scene: "waves",
    colors: ["#4a2bd0", "#c8ff4d", "#ff3df2"],
    sceneOpacity: 0.9,
    photoLabels: { photoHero: "En séance", photoAbout: "Votre coach", photo1: "La salle", photo2: "Extérieur", photo3: "Résultats" },
    preview: { bg: "#07060d", fg: "#f4f4f4", accent: "#c8ff4d" },
    content: {
      brand: "PULSE",
      kicker: "Coaching sportif — Bordeaux",
      heroTitle: "Plus fort que hier",
      heroSubtitle:
        "Séances individuelles et petits groupes. Un programme construit pour vous, mesuré chaque semaine, sans blabla.",
      cta: "Séance d'essai offerte",
      aboutTitle: "Un coach, un plan, des résultats",
      aboutText:
        "Douze ans de terrain, plus de trois cents personnes accompagnées. On fixe un objectif clair, on mesure, on ajuste. Vous progressez, ou on change de méthode.",
      s1Title: "Force",
      s1Text: "Musculation guidée, technique d'abord, charges ensuite.",
      s2Title: "Cardio",
      s2Text: "Fractionné et endurance, en salle ou en extérieur.",
      s3Title: "Nutrition",
      s3Text: "Des repères simples, adaptés à votre quotidien.",
      quote: "Huit kilos en moins, et surtout l'envie d'y retourner.",
      quoteAuthor: "Mehdi, 34 ans",
      email: "go@pulse-coaching.example",
      phone: "05 00 00 00 00",
      address: "Quai des Sports, 33000 Bordeaux",
      hours: "Tous les jours : 7 h – 21 h, sur réservation.",
      ...noPhotos,
    },
  },
  {
    id: "atelier",
    name: "Atelier",
    sector: "Créateur · Boutique · Bien-être",
    pitch: "Une étoffe nacrée qui respire sur fond clair. Doux, lumineux, élégant.",
    scene: "silk",
    colors: ["#f2b8c6", "#b9c8ff", "#ffffff"],
    sceneOpacity: 0.55,
    light: true,
    photoLabels: { photoHero: "La collection", photoAbout: "L'atelier", photo1: "Tasses", photo2: "Bols", photo3: "Vases" },
    preview: { bg: "#f6f1ec", fg: "#2a2420", accent: "#c98a9a" },
    content: {
      brand: "Atelier Nacre",
      kicker: "Céramique faite main — Nantes",
      heroTitle: "Des objets qui prennent leur temps",
      heroSubtitle:
        "Tasses, bols et vases tournés à la main, en petites séries. Chaque pièce est unique, signée et numérotée.",
      cta: "Découvrir la collection",
      aboutTitle: "La main, la terre, le four",
      aboutText:
        "Tout est façonné dans notre atelier nantais, émaillé avec des recettes maison et cuit à 1280 °C. Nous produisons peu, pour produire bien.",
      s1Title: "La collection",
      s1Text: "Vaisselle du quotidien, disponible à l'atelier et en ligne.",
      s2Title: "Les stages",
      s2Text: "Initiation au tour, le samedi, par groupes de quatre.",
      s3Title: "Sur commande",
      s3Text: "Services complets pour restaurants et listes de mariage.",
      quote: "Mon café du matin n'a plus le même goût. Vraiment.",
      quoteAuthor: "Lucie, cliente depuis 2022",
      email: "bonjour@atelier-nacre.example",
      phone: "02 00 00 00 00",
      address: "8 rue du Tour, 44000 Nantes",
      hours: "Mercredi – samedi : 10 h – 19 h.",
      ...noPhotos,
    },
  },
  {
    id: "cabinet",
    name: "Cabinet",
    sector: "Avocat · Expert-comptable · Conseil",
    pitch: "Sobre et rassurant : typographie classique, bleu nuit, une mise en page aussi rigoureuse que votre métier.",
    colors: ["#f7f6f2", "#14213d", "#b08d57"],
    sceneOpacity: 0,
    light: true,
    photoLabels: { photoHero: "Le cabinet", photoAbout: "L'équipe", photo1: "Les bureaux", photo2: "La salle de réunion", photo3: "L'accueil" },
    preview: { bg: "#f7f6f2", fg: "#14213d", accent: "#b08d57" },
    content: {
      brand: "Cabinet Delorme",
      kicker: "Avocats associés — Rennes",
      heroTitle: "Le droit des affaires, expliqué simplement",
      heroSubtitle:
        "Nous accompagnons les dirigeants de TPE et de PME : contrats, litiges commerciaux, droit du travail. Un interlocuteur unique, des honoraires annoncés à l'avance.",
      cta: "Prendre rendez-vous",
      aboutTitle: "Un cabinet à taille humaine",
      aboutText:
        "Trois avocats, vingt ans d'expérience cumulée et une règle : vous répondre sous 48 heures. Chaque dossier est suivi par un associé, du premier échange jusqu'à sa conclusion.",
      s1Title: "Contrats",
      s1Text: "Rédaction et relecture de vos contrats commerciaux, conditions générales et pactes d'associés.",
      s2Title: "Contentieux",
      s2Text: "Recouvrement, litiges avec un fournisseur ou un client : négociation d'abord, tribunal si nécessaire.",
      s3Title: "Droit social",
      s3Text: "Embauche, rupture, contrôle : sécurisez vos décisions avant de les prendre.",
      quote: "Des réponses claires, des délais tenus. Exactement ce qu'on attend d'un avocat.",
      quoteAuthor: "Dirigeante d'une PME de 40 salariés",
      email: "contact@cabinet-delorme.example",
      phone: "02 00 00 00 00",
      address: "8 place de Bretagne, 35000 Rennes",
      hours: "Du lundi au vendredi, 9 h – 18 h 30, sur rendez-vous.",
      ...noPhotos,
    },
  },
  {
    id: "clarte",
    name: "Clarté",
    sector: "Santé · Kiné · Dentiste",
    pitch: "Blanc, aéré, des repères clairs : un site qui rassure avant même la première consultation.",
    colors: ["#ffffff", "#0f766e", "#e6f2f1"],
    sceneOpacity: 0,
    light: true,
    photoLabels: { photoHero: "Le cabinet", photoAbout: "La praticienne", photo1: "La salle de soin", photo2: "L'équipement", photo3: "L'accueil" },
    preview: { bg: "#ffffff", fg: "#0f2a2e", accent: "#0f766e" },
    content: {
      brand: "Kiné Laurent",
      kicker: "Cabinet de kinésithérapie — Cesson-Sévigné",
      heroTitle: "Retrouver le mouvement, à votre rythme",
      heroSubtitle:
        "Rééducation, sport, douleurs du dos : des séances individuelles de 45 minutes, dans un cabinet de plain-pied accessible à tous.",
      cta: "Prendre rendez-vous",
      aboutTitle: "Une prise en charge globale",
      aboutText:
        "Chaque patient commence par un bilan complet. Nous construisons ensuite un programme adapté, avec des exercices simples à refaire chez vous entre deux séances.",
      s1Title: "Rééducation",
      s1Text: "Après une opération, une fracture ou une entorse, sur prescription médicale.",
      s2Title: "Kiné du sport",
      s2Text: "Prévention des blessures, reprise après une pause, préparation d'une compétition.",
      s3Title: "Dos et posture",
      s3Text: "Lombalgies, cervicalgies, travail de bureau : soulager et prévenir.",
      quote: "Un suivi sérieux et des explications à chaque séance. Je sais enfin ce que je fais et pourquoi.",
      quoteAuthor: "Une patiente",
      email: "cabinet@kine-laurent.example",
      phone: "02 00 00 00 00",
      address: "3 rue des Peupliers, 35510 Cesson-Sévigné",
      hours: "Du lundi au vendredi, 8 h – 20 h. Samedi matin sur rendez-vous.",
      ...noPhotos,
    },
  },
  {
    id: "ligne",
    name: "Ligne",
    sector: "Immobilier · Architecte d'intérieur · Consultant",
    pitch: "Noir sur blanc, grandes photos, une grille éditoriale : l'élégance sans effet.",
    colors: ["#ffffff", "#111111", "#8a8a8a"],
    sceneOpacity: 0,
    light: true,
    photoLabels: { photoHero: "Le projet", photoAbout: "Le studio", photo1: "Salon", photo2: "Cuisine", photo3: "Chambre" },
    preview: { bg: "#ffffff", fg: "#111111", accent: "#8a8a8a" },
    content: {
      brand: "Studio Morel",
      kicker: "Architecture intérieure",
      heroTitle: "Des intérieurs pensés pour durer",
      heroSubtitle:
        "Rénovation d'appartements et de maisons, de la conception au suivi de chantier. Un seul interlocuteur, un budget tenu.",
      cta: "Parler de votre projet",
      aboutTitle: "Moins, mais mieux",
      aboutText:
        "Nous partons de votre façon de vivre, pas d'une tendance. Matériaux durables, artisans locaux, plans précis : chaque projet est livré clé en main.",
      s1Title: "Conception",
      s1Text: "Plans, rendus 3D et choix des matériaux, validés avec vous étape par étape.",
      s2Title: "Rénovation",
      s2Text: "Coordination des artisans et suivi du chantier jusqu'à la remise des clés.",
      s3Title: "Conseil",
      s3Text: "Une visite de deux heures pour repenser une pièce, avec un plan d'action écrit.",
      quote: "Ils ont compris en une visite ce que nous cherchions depuis des mois.",
      quoteAuthor: "Claire et Thomas, rénovation d'une longère",
      email: "bonjour@studio-morel.example",
      phone: "02 00 00 00 00",
      address: "21 rue de Saint-Malo, 35000 Rennes",
      hours: "Du lundi au vendredi, 9 h – 18 h, visites sur rendez-vous.",
      ...noPhotos,
    },
  },
];

/** Ordre d'affichage : styles alternés, sobres et animés, pour montrer la diversité. */
const SHOWCASE: TemplateDef["id"][] = ["cabinet", "pulse", "clarte", "aurore", "ligne", "monolithe", "atelier"];
export const showcase = SHOWCASE.map((id) => templates.find((t) => t.id === id)!).filter(Boolean);

/** Sélection de l'accueil : quatre exemples volontairement très différents. */
export const homeShowcase = (["cabinet", "pulse", "ligne", "aurore"] as const).map((id) => templates.find((t) => t.id === id)!);

export function getTemplate(id: string | null | undefined): TemplateDef | undefined {
  return templates.find((t) => t.id === id);
}

/** Fusionne un contenu partiel (JSON stocké) avec les valeurs par défaut du modèle. */
export function resolveContent(template: TemplateDef, raw: string | Partial<SiteContent> | null): SiteContent {
  let parsed: Partial<SiteContent> = {};
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as Partial<SiteContent>;
    } catch {
      parsed = {};
    }
  } else if (raw) {
    parsed = raw;
  }
  const out = { ...template.content };
  for (const f of contentFields) {
    const v = parsed[f.key];
    if (typeof v === "string") out[f.key] = v.slice(0, f.max);
  }
  for (const s of photoSlots) {
    const v = parsed[s.key];
    out[s.key] = typeof v === "string" && MEDIA_PATH.test(v) ? v : "";
  }
  return out;
}
