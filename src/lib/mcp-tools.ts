import "server-only";
import { all, type LeadRow } from "./db";
import {
  DataError,
  addDomain,
  createClient,
  createSiteFromBrief,
  createSiteFromTemplate,
  findSite,
  listClients,
  listDomains,
  listRequests,
  listSites,
  overview,
  replyToRequest,
  setSiteHtml,
  setSiteStatus,
  updateSiteContent,
} from "./data";
import { contentFields, getTemplate, resolveContent, templates } from "./templates";

type Args = Record<string, unknown>;
type Tool = {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  handler: (args: Args) => unknown;
};

const s = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra });

function text(args: Args, key: string, required = true): string {
  const v = args[key];
  if (typeof v === "string" && v.trim()) return v;
  if (required) throw new DataError(`Paramètre manquant : ${key}`);
  return "";
}

const siteSummary = (site: ReturnType<typeof listSites>[number]) => ({
  id: site.id,
  slug: site.slug,
  name: site.name,
  kind: site.kind,
  template: site.template_id,
  status: site.status,
  client: site.client_email,
  url: `/s/${site.slug}`,
  updated_at: site.updated_at,
});

const contentSchema = {
  type: "object",
  description: "Champs de contenu du modèle (tous facultatifs). Texte brut, en français.",
  properties: Object.fromEntries(contentFields.map((f) => [f.key, s(`${f.group} — ${f.label} (max ${f.max} car.)`)])),
};

export const HTML_GUIDE = `Règles pour le HTML d'un site sur-mesure :
- Un seul document HTML complet et autonome (<!doctype html>, <html lang="fr">, <head>, <body>), CSS et JS intégrés. 1,5 Mo maximum.
- Scripts externes autorisés UNIQUEMENT depuis cdn.jsdelivr.net, cdnjs.cloudflare.com ou unpkg.com (three.js, GSAP…). Aucun appel réseau (fetch/XHR) n'est possible.
- Polices : pile système ou police intégrée en data:. Pas de Google Fonts (RGPD). Images : data:, SVG en ligne ou URL https.
- Niveau attendu : scène 3D (three.js) réactive au défilement, animations soignées, responsive mobile, contrastes lisibles, respect de prefers-reduced-motion.
- Accessibilité : un seul <h1>, textes alternatifs, navigation au clavier.
- Pied de page : coordonnées du client et lien vers ses mentions légales.`;

export const tools: Tool[] = [
  {
    name: "get_overview",
    description: "Vue d'ensemble de l'activité : nombre de clients, sites, briefs en attente, demandes ouvertes, prospects, domaines qui expirent.",
    inputSchema: { type: "object", properties: {} },
    handler: () => overview(),
  },
  {
    name: "list_templates",
    description: "Liste les modèles de sites 3D disponibles, avec leurs champs de contenu éditables et leurs valeurs par défaut.",
    inputSchema: { type: "object", properties: {} },
    handler: () => ({
      fields: contentFields.map((f) => ({ key: f.key, label: f.label, group: f.group, max: f.max })),
      templates: templates.map((t) => ({ id: t.id, name: t.name, sector: t.sector, pitch: t.pitch, demo: `/modeles/${t.id}`, defaultContent: t.content })),
    }),
  },
  {
    name: "list_clients",
    description: "Liste les comptes clients (nom, e-mail, entreprise, nombre de sites).",
    inputSchema: { type: "object", properties: {} },
    handler: () => listClients(),
  },
  {
    name: "create_client",
    description:
      "Crée un compte client. Renvoie un mot de passe provisoire affiché une seule fois : à transmettre au client par un canal sûr.",
    inputSchema: {
      type: "object",
      properties: { name: s("Nom complet"), email: s("Adresse e-mail"), company: s("Entreprise (facultatif)") },
      required: ["name", "email"],
    },
    handler: (a) => createClient({ name: text(a, "name"), email: text(a, "email"), company: text(a, "company", false) }),
  },
  {
    name: "list_sites",
    description: "Liste les sites. Filtre facultatif par statut. Utilisez status=\"brief\" pour trouver les briefs en attente de génération.",
    inputSchema: {
      type: "object",
      properties: { status: s("Filtre de statut", { enum: ["brief", "draft", "review", "live"] }) },
    },
    handler: (a) => listSites(text(a, "status", false) || undefined).map(siteSummary),
  },
  {
    name: "get_site",
    description: "Détail d'un site : brief, contenu (site sur modèle) ou HTML (site sur-mesure).",
    inputSchema: { type: "object", properties: { site: s("Identifiant ou slug du site") }, required: ["site"] },
    handler: (a) => {
      const site = findSite(text(a, "site"));
      const template = getTemplate(site.template_id);
      return {
        id: site.id,
        slug: site.slug,
        name: site.name,
        kind: site.kind,
        status: site.status,
        url: `/s/${site.slug}`,
        brief: site.brief,
        template: site.template_id,
        content: template ? resolveContent(template, site.content) : null,
        html: site.html,
      };
    },
  },
  {
    name: "create_site_from_template",
    description:
      "Crée un site à partir d'un modèle 3D existant. Rédigez le contenu (titres, textes, coordonnées) adapté à l'activité du client. Le site est créé en brouillon.",
    inputSchema: {
      type: "object",
      properties: {
        name: s("Nom du site / de l'entreprise"),
        template_id: s("Identifiant du modèle", { enum: templates.map((t) => t.id) }),
        client: s("E-mail ou identifiant du client propriétaire (facultatif)"),
        content: contentSchema,
      },
      required: ["name", "template_id"],
    },
    handler: (a) => {
      const site = createSiteFromTemplate({
        name: text(a, "name"),
        templateId: text(a, "template_id"),
        client: text(a, "client", false) || null,
        content: a.content,
      });
      return { ...site, url: `/s/${site.slug}`, status: "draft" };
    },
  },
  {
    name: "create_custom_site",
    description: `Crée un site sur-mesure à partir du brief d'un client. Si "html" est fourni, la page est enregistrée et passe « à valider » ; sinon seul le brief est enregistré (statut « brief »).\n\n${HTML_GUIDE}`,
    inputSchema: {
      type: "object",
      properties: {
        name: s("Nom du site / de l'entreprise"),
        brief: s("Demande du client, telle qu'exprimée (20 caractères minimum)"),
        client: s("E-mail ou identifiant du client propriétaire (facultatif)"),
        html: s("Document HTML complet généré à partir du brief (facultatif)"),
      },
      required: ["name", "brief"],
    },
    handler: (a) => {
      const site = createSiteFromBrief({ name: text(a, "name"), brief: text(a, "brief"), client: text(a, "client", false) || null });
      const html = text(a, "html", false);
      if (html) setSiteHtml(site.id, html);
      return { ...site, url: `/s/${site.slug}`, status: html ? "review" : "brief" };
    },
  },
  {
    name: "set_site_html",
    description: `Enregistre ou remplace la page HTML d'un site sur-mesure (par exemple pour traiter un brief en attente ou une demande de modification).\n\n${HTML_GUIDE}`,
    inputSchema: {
      type: "object",
      properties: { site: s("Identifiant ou slug du site"), html: s("Document HTML complet") },
      required: ["site", "html"],
    },
    handler: (a) => {
      const site = setSiteHtml(text(a, "site"), text(a, "html"));
      return { ok: true, url: `/s/${site.slug}` };
    },
  },
  {
    name: "update_site_content",
    description: "Modifie le contenu d'un site basé sur un modèle. Seuls les champs fournis sont changés.",
    inputSchema: {
      type: "object",
      properties: { site: s("Identifiant ou slug du site"), content: contentSchema },
      required: ["site", "content"],
    },
    handler: (a) => {
      const site = updateSiteContent(text(a, "site"), a.content);
      return { ok: true, url: `/s/${site.slug}` };
    },
  },
  {
    name: "set_site_status",
    description:
      "Change le statut d'un site : draft (brouillon), review (à valider), live (en ligne, visible de tous). Ne passez un site « live » que sur demande explicite de l'administrateur.",
    inputSchema: {
      type: "object",
      properties: { site: s("Identifiant ou slug du site"), status: s("Nouveau statut", { enum: ["brief", "draft", "review", "live"] }) },
      required: ["site", "status"],
    },
    handler: (a) => {
      const site = setSiteStatus(text(a, "site"), text(a, "status"));
      return { ok: true, slug: site.slug, status: text(a, "status") };
    },
  },
  {
    name: "list_requests",
    description: "Liste les demandes de modification envoyées par les clients. Filtre facultatif par statut.",
    inputSchema: {
      type: "object",
      properties: { status: s("Filtre de statut", { enum: ["new", "in_progress", "done"] }) },
    },
    handler: (a) => listRequests({ status: text(a, "status", false) || undefined }),
  },
  {
    name: "reply_to_request",
    description: "Répond à une demande de modification (message visible par le client) et/ou change son statut.",
    inputSchema: {
      type: "object",
      properties: {
        request_id: s("Identifiant de la demande"),
        message: s("Message au client (facultatif si un statut est fourni)"),
        status: s("Nouveau statut (facultatif)", { enum: ["new", "in_progress", "done"] }),
      },
      required: ["request_id"],
    },
    handler: (a) => {
      const message = text(a, "message", false);
      const status = text(a, "status", false) || undefined;
      if (!message && !status) throw new DataError("Fournissez un message ou un statut.");
      replyToRequest(text(a, "request_id"), { name: "Webcrea", role: "admin" }, message, status);
      return { ok: true };
    },
  },
  {
    name: "list_domains",
    description: "Liste les noms de domaine suivis, avec date d'expiration et jours restants.",
    inputSchema: { type: "object", properties: {} },
    handler: () => listDomains(),
  },
  {
    name: "add_domain",
    description: "Ajoute un nom de domaine au registre de suivi (n'achète rien : l'enregistrement se fait chez le registrar).",
    inputSchema: {
      type: "object",
      properties: {
        name: s("Nom de domaine, ex. mon-site.fr"),
        site: s("Identifiant ou slug du site rattaché (facultatif)"),
        registrar: s("Registrar (facultatif)"),
        expires_at: s("Date d'expiration AAAA-MM-JJ (facultatif)"),
        auto_renew: { type: "boolean", description: "Renouvellement automatique (vrai par défaut)" },
      },
      required: ["name"],
    },
    handler: (a) =>
      addDomain({
        name: text(a, "name"),
        site: text(a, "site", false) || null,
        registrar: text(a, "registrar", false),
        expiresAt: text(a, "expires_at", false),
        autoRenew: a.auto_renew !== false,
      }),
  },
  {
    name: "list_leads",
    description: "Liste les demandes de devis reçues via le site vitrine (prospects).",
    inputSchema: { type: "object", properties: {} },
    handler: () => all<LeadRow>("SELECT id, name, email, company, message, estimate, status, created_at FROM leads ORDER BY created_at DESC LIMIT 100"),
  },
];
