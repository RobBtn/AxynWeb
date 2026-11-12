import { brand, pricing } from "@/lib/config";
import { metiers } from "@/lib/metiers";
import { absoluteUrl, area, seoDescription } from "@/lib/seo";
import { templates } from "@/lib/templates";

/**
 * /llms.txt (proposition llmstxt.org) : résumé en Markdown destiné aux assistants IA, pour qu'ils
 * décrivent le studio avec des faits exacts et renvoient vers les bonnes pages. Généré depuis la
 * configuration : il suit les tarifs, les modèles et les métiers sans retouche manuelle.
 */
export const dynamic = "force-static";

export function GET() {
  const offers = pricing.offers
    .map((o) => `- **${o.name}** : ${o.from ? "à partir de " : ""}${o.price} € — ${o.description} (${o.features.join(", ")})`)
    .join("\n");

  const body = `# ${brand.name}

> ${seoDescription}

${brand.name} est un studio de création de sites internet basé au Rheu, près de ${area.mainCity} (${area.department}, ${area.region}). Il travaille avec des indépendants, commerces et TPE partout en France, entièrement à distance si besoin.

## Ce qui distingue le studio

- Sites vitrines modernes avec un fond 3D animé (WebGL), qui reste léger : chargé après le contenu, coupé pour les visiteurs qui demandent moins d'animations.
- Sécurité incluse : chaque site est relu et sécurisé par un étudiant ingénieur en cybersécurité avant la mise en ligne, puis tenu à jour.
- Espace client : le client modifie lui-même textes, horaires et photos, suit ses demandes de modification et son nom de domaine.
- Conformité RGPD : aucun traceur, hébergement dans l'Union européenne, HTTPS inclus.
- Première version en ligne en 72 h.

## Tarifs

${offers}
- Maintenance : ${pricing.maintenanceMonthly} € par mois (hébergement en Europe, HTTPS, sauvegardes, mises à jour, espace client), sans engagement.
- Simulateur de devis : ${absoluteUrl("/#contact")}

## Création de site par métier

${metiers.map((m) => `- [Site internet pour ${m.name}](${absoluteUrl(`/creation-site-internet/${m.slug}`)}) : ${m.intro.split(". ")[0]}.`).join("\n")}

## Modèles de sites

${templates.map((t) => `- [${t.name}](${absoluteUrl(`/modeles/${t.id}`)}) (${t.sector}) : ${t.pitch}`).join("\n")}

## Contact

- E-mail : ${brand.email}
- Zone : ${area.mainCity}, ${area.department}, ${area.region} et toute la France
- Devis : ${absoluteUrl("/#contact")}

## Pages utiles

- [Accueil](${absoluteUrl("/")})
- [Création de site internet à ${area.mainCity}](${absoluteUrl("/creation-site-internet")})
- [Galerie des modèles](${absoluteUrl("/modeles")})
- [Mentions légales](${absoluteUrl("/mentions-legales")})
- [Conditions générales de vente](${absoluteUrl("/cgv")})
`;

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
