/**
 * Pages « création de site pour <métier> » (/creation-site-internet/<slug>) : une page par recherche
 * fréquente des indépendants. Contenu propre à chaque métier, sans avis ni réalisation inventés.
 * Ajouter un métier : une entrée ici ; le sitemap, llms.txt et la page d'index suivent.
 */
import type { TemplateDef } from "@/lib/templates";

export type Metier = {
  slug: string;
  /** « restaurant », au singulier, pour les titres : « Création de site internet pour restaurant ». */
  name: string;
  /** Pluriel affiché dans les listes. */
  plural: string;
  template: TemplateDef["id"];
  intro: string;
  /** Ce que les clients de ce métier cherchent en ligne. */
  needs: string[];
  /** Les blocs du site proposés. */
  sections: { title: string; text: string }[];
  /** Conseils de référencement local propres au métier. */
  seoTips: string[];
  faq: { q: string; a: string }[];
};

export const metiers: Metier[] = [
  {
    slug: "restaurant",
    name: "restaurant",
    plural: "Restaurants",
    template: "aurore",
    intro:
      "Avant de réserver, vos futurs clients regardent la carte, les photos de la salle et les horaires sur leur téléphone. Un site de restaurant doit donner faim en trois secondes et répondre aux questions pratiques sans détour.",
    needs: ["La carte et les prix, lisibles sur mobile", "Les horaires, y compris les fermetures exceptionnelles", "Un bouton d'appel et l'itinéraire en un geste", "Des photos de plats et de la salle qui donnent envie"],
    sections: [
      { title: "La carte toujours à jour", text: "Horaires, textes et photos se modifient depuis l'espace client, en ligne en une minute. La carte complète, en texte et sans PDF, a sa page dans la formule Signature." },
      { title: "Réservation simple", text: "Appel direct ou lien vers votre outil de réservation : le chemin le plus court vers une table." },
      { title: "Un fond 3D chaleureux", text: "Le modèle Aurore fait onduler une lumière chaude derrière vos photos, pour une ambiance qui ressemble à votre salle." },
    ],
    seoTips: ["Nom, adresse et téléphone identiques sur le site et sur votre fiche Google", "Une page qui cite votre quartier et votre type de cuisine", "La carte en texte, pas en image : Google et les assistants IA peuvent la lire"],
    faq: [
      { q: "Puis-je modifier ma carte moi-même ?", a: "Oui. Depuis l'espace client, vous changez vos textes, vos horaires et vos photos, et c'est en ligne immédiatement. Avec une page « carte » (formule Signature), vos plats et vos prix se modifient de la même façon." },
      { q: "Le site remplace-t-il ma fiche Google ?", a: "Non, il la complète. La fiche Google amène les clients du quartier, le site les convainc ; nous vous aidons à aligner les deux." },
      { q: "Peut-on ajouter la réservation en ligne ?", a: "Oui : un bouton vers votre outil de réservation existant, ou un formulaire de demande en option." },
    ],
  },
  {
    slug: "boulangerie",
    name: "boulangerie",
    plural: "Boulangeries",
    template: "aurore",
    intro:
      "Une boulangerie se choisit souvent sur le trajet : horaires, jours de fermeture, spécialités. Un site clair répond à ces questions et met en valeur ce qui fait votre réputation.",
    needs: ["Horaires et jours de fermeture bien visibles", "Les spécialités et les produits de saison", "Les commandes pour les fêtes et les événements", "L'adresse et l'itinéraire depuis un téléphone"],
    sections: [
      { title: "Vos produits en vitrine", text: "Pains, viennoiseries, pâtisseries : de grandes photos que vous changez vous-même au fil des saisons." },
      { title: "Commandes à l'avance", text: "Galettes, bûches, pièces montées : vos offres de saison mises en avant, et un formulaire de commande en option, sans plateforme payante." },
      { title: "Infos pratiques en premier", text: "Horaires, congés et fermetures exceptionnelles en haut de page, mis à jour depuis l'espace client." },
    ],
    seoTips: ["Citer votre commune et vos spécialités dans les titres", "Publier vos horaires de fêtes à l'avance", "Garder les mêmes horaires sur le site et la fiche Google"],
    faq: [
      { q: "Puis-je annoncer une fermeture pour congés ?", a: "Oui, en quelques secondes depuis l'espace client : vos horaires et votre message d'accueil sont mis à jour aussitôt." },
      { q: "Faut-il une boutique en ligne ?", a: "Rarement. Une commande par téléphone, à retirer en magasin, suffit dans la plupart des cas, et coûte bien moins cher." },
    ],
  },
  {
    slug: "artisan",
    name: "artisan",
    plural: "Artisans du bâtiment",
    template: "monolithe",
    intro:
      "Plombier, électricien, menuisier, maçon : vos clients comparent plusieurs artisans avant d'appeler. Un site sérieux, avec vos réalisations et votre zone d'intervention, vous fait passer en tête de liste.",
    needs: ["Les prestations et la zone d'intervention", "Des photos de chantiers avant / après", "Un formulaire de demande de devis", "Les certifications et assurances (RGE, décennale…)"],
    sections: [
      { title: "Vos chantiers en images", text: "Des cadres photo pour vos réalisations, que vous changez depuis votre téléphone ; une galerie complète de chantiers dans la formule Signature." },
      { title: "Demande de devis qualifiée", text: "Appel direct depuis un téléphone, ou formulaire détaillé (type de travaux, commune, délai) en formule Signature : vous rappelez les bons clients." },
      { title: "Un style net et solide", text: "Le modèle Monolithe affiche un relief filaire, comme un plan qui prend vie, et une typographie massive." },
    ],
    seoTips: ["Une section par prestation (« rénovation de salle de bain », « dépannage »…)", "La liste des communes où vous intervenez", "Vos labels écrits en toutes lettres"],
    faq: [
      { q: "Je n'ai pas de photos professionnelles, est-ce un problème ?", a: "Non. Des photos de chantier prises au téléphone suffisent ; le modèle les met en valeur dans des cadres soignés." },
      { q: "Puis-je indiquer plusieurs communes d'intervention ?", a: "Oui, et c'est conseillé : c'est ce que les clients tapent dans Google (« plombier + commune »)." },
    ],
  },
  {
    slug: "coach-sportif",
    name: "coach sportif",
    plural: "Coachs et salles de sport",
    template: "pulse",
    intro:
      "Coach, salle de sport, studio de yoga : vos futurs adhérents veulent sentir l'énergie avant de franchir la porte. Le site doit motiver, présenter vos formules et faciliter la première séance.",
    needs: ["Les formules et les tarifs", "Le planning des cours", "Votre parcours et vos diplômes", "Une séance d'essai facile à réserver"],
    sections: [
      { title: "De l'énergie dès l'arrivée", text: "Le modèle Pulse fait rouler une nappe de points néon vers l'horizon, avec des titres géants." },
      { title: "Formules et planning", text: "Vos offres et vos tarifs, modifiables à chaque saison depuis l'espace client ; le planning détaillé a sa page dans la formule Signature." },
      { title: "Prise de contact directe", text: "Séance d'essai, bilan, question : un lien vers votre outil de réservation, ou l'appel direct depuis un téléphone." },
    ],
    seoTips: ["Préciser votre spécialité (préparation physique, remise en forme, yoga…)", "Indiquer si vous intervenez à domicile, en salle ou en extérieur", "Mettre vos diplômes en texte"],
    faq: [
      { q: "Puis-je publier mon planning de cours ?", a: "Oui : sur une page dédiée (formule Signature), ou par un lien vers votre outil de réservation si vous en avez déjà un." },
      { q: "Le fond animé fonctionne-t-il sur mobile ?", a: "Oui. Il s'adapte à la puissance du téléphone et se coupe pour les visiteurs qui préfèrent moins d'animations." },
    ],
  },
  {
    slug: "coiffeur",
    name: "salon de coiffure",
    plural: "Coiffeurs et instituts",
    template: "atelier",
    intro:
      "Un salon de coiffure ou un institut se choisit sur l'ambiance, les réalisations et la facilité de prise de rendez-vous. Votre site doit refléter votre style et mener au rendez-vous en un clic.",
    needs: ["Les prestations et les tarifs", "Des photos de réalisations", "La prise de rendez-vous", "Les horaires et l'accès au salon"],
    sections: [
      { title: "Un univers doux et soigné", text: "Le modèle Atelier fait respirer une étoffe nacrée sur fond clair : élégant, lumineux, à votre image." },
      { title: "Tarifs lisibles", text: "Coupes, couleurs, soins : une grille claire que vous ajustez vous-même." },
      { title: "Rendez-vous en un clic", text: "Un bouton vers votre agenda en ligne, ou l'appel direct depuis un téléphone." },
    ],
    seoTips: ["Nommer vos spécialités (coloration végétale, barbier, mariage…)", "Ajouter des photos avec une description en texte", "Lier le site et la fiche Google"],
    faq: [
      { q: "Mon agenda en ligne est déjà en place, est-ce compatible ?", a: "Oui. Le site renvoie vers votre outil existant : vous ne changez pas vos habitudes." },
      { q: "Puis-je changer les photos souvent ?", a: "Oui, autant que vous voulez, depuis l'espace client, avec un aperçu ordinateur et mobile." },
    ],
  },
  {
    slug: "therapeute",
    name: "thérapeute",
    plural: "Ostéopathes et thérapeutes",
    template: "atelier",
    intro:
      "Ostéopathe, kinésithérapeute, sophrologue, psychologue : vos patients cherchent à être rassurés avant de prendre rendez-vous. Un site sobre et clair explique votre approche, vos tarifs et l'accès au cabinet.",
    needs: ["Votre approche et les motifs de consultation", "Le déroulé d'une séance et les tarifs", "La prise de rendez-vous", "L'accès au cabinet et l'accessibilité"],
    sections: [
      { title: "Un ton apaisant", text: "Le modèle Atelier, sur fond clair et nacré, installe une atmosphère calme et professionnelle." },
      { title: "Des réponses avant la séance", text: "Déroulé, durée, tarifs, remboursement : les questions que les patients se posent, traitées sur la page." },
      { title: "Confidentialité respectée", text: "Aucun traceur, formulaires sécurisés, hébergement en Europe : un site conforme au RGPD." },
    ],
    seoTips: ["Décrire les motifs de consultation avec les mots des patients", "Respecter les règles de communication de votre profession", "Indiquer votre ville et l'accès au cabinet"],
    faq: [
      { q: "Le site respecte-t-il les règles de ma profession ?", a: "Le contenu reste informatif, sans promesse de résultat. Vous validez chaque texte avant la mise en ligne." },
      { q: "Les données de mes patients sont-elles protégées ?", a: "Le site ne contient aucun traceur et ses formulaires sont sécurisés. Nous ne stockons pas de données de santé." },
    ],
  },
];

export const getMetier = (slug: string) => metiers.find((m) => m.slug === slug);
