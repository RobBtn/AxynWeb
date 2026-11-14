import "server-only";
import { geocodeProspects } from "./geocode";
import { all, audit, type LeadRow } from "./db";
import {
  DataError,
  PROSPECT_PRIORITIES,
  PROSPECT_STATUSES,
  addDomain,
  addProspects,
  createClient,
  createSiteFromBrief,
  createSiteFromTemplate,
  deleteProspects,
  findSite,
  getProspect,
  listClients,
  listDomains,
  listProspects,
  listRequests,
  listSites,
  overview,
  replyToRequest,
  setSiteHtml,
  setSiteStatus,
  tagProspects,
  updateProspect,
  updateSiteContent,
} from "./data";
import { adminTools } from "./mcp-tools-admin";
import { prospectTags } from "./prospect-tags";
import { contentFields, getTemplate, resolveContent, templates } from "./templates";

type Args = Record<string, unknown>;
type Tool = {
  name: string;
  description: string;
  inputSchema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
  handler: (args: Args) => unknown | Promise<unknown>;
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

const coreTools: Tool[] = [
  {
    name: "get_overview",
    description:
      "Vue d'ensemble de l'activité : nombre de clients, sites, briefs en attente, demandes ouvertes, demandes de devis, domaines qui expirent, et la prospection à froid (total, par statut, cases à rappeler / entretien / vu en présentiel / à repasser).",
    inputSchema: { type: "object", properties: {} },
    handler: () => overview(),
  },
  {
    name: "list_templates",
    description: "Liste les modèles de sites 3D disponibles, avec leurs champs de contenu éditables et leurs valeurs par défaut.",
    inputSchema: { type: "object", properties: {} },
    handler: () => ({
      fields: contentFields.map((f) => ({ key: f.key, label: f.label, group: f.group, max: f.max })),
      templates: templates.map((t) => ({ id: t.id, name: t.name, sector: t.sector, pitch: t.pitch, demo: `/exemples/${t.id}`, defaultContent: t.content })),
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
      replyToRequest(text(a, "request_id"), { name: "AxynWeb", role: "admin" }, message, status);
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
    description:
      "Ajoute un nom de domaine et le rattache à un site : une fois le DNS du domaine pointé vers le serveur (enregistrement A) et le site « En ligne », le site est servi sur ce domaine avec HTTPS automatique. N'achète rien : l'enregistrement se fait chez le registrar.",
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
    name: "list_prospects",
    description:
      "Liste la prospection à froid : les commerces repérés par le studio, SANS demande de leur part (à ne pas confondre avec list_leads, les demandes de devis reçues). " +
      "Chaque prospect a : id, name, activity, phone, email, website (son site actuel), address, city (ville, déduite de l'adresse si non fournie), lat/lng (position calculée depuis l'adresse), rating (note Google), category (« A. Aucun site », « B. Site cassé ou mort », « C. Site pourri ou daté », « D. Non évalué »), " +
      "priority (« Haute », « Normale », « À vérifier »), finding (le constat sur son site), notes (texte libre), status (new = nouveau, contacted = contacté, won = gagné, lost = perdu), " +
      `tags (cases de suivi cochées : ${prospectTags.map((t) => `${t.id} = ${t.label}`).join(", ")}) et created_at. ` +
      "Tous les filtres sont facultatifs et se cumulent ; la recherche `query` porte sur le nom, l'activité, le téléphone, l'e-mail, le site, l'adresse, le constat et les notes. " +
      "La réponse indique le total et se parcourt avec limit/offset (50 par défaut, 200 au plus).",
    inputSchema: {
      type: "object",
      properties: {
        status: s("Statut", { enum: [...PROSPECT_STATUSES] }),
        tag: s("Case de suivi cochée", { enum: prospectTags.map((t) => t.id) }),
        category: s("Texte contenu dans la catégorie, ex. « Aucun site »"),
        priority: s("Priorité", { enum: [...PROSPECT_PRIORITIES] }),
        city: s("Ville exacte, ex. « Rennes »"),
        query: s("Recherche dans le nom, l'activité, le téléphone et le constat"),
        limit: { type: "integer", description: "Nombre de résultats (50 par défaut, 200 au plus)" },
        offset: { type: "integer", description: "Nombre de résultats à sauter" },
      },
    },
    handler: (a) =>
      listProspects({
        status: text(a, "status", false) || undefined,
        tag: text(a, "tag", false) || undefined,
        category: text(a, "category", false) || undefined,
        priority: text(a, "priority", false) || undefined,
        city: text(a, "city", false) || undefined,
        query: text(a, "query", false) || undefined,
        limit: typeof a.limit === "number" ? a.limit : undefined,
        offset: typeof a.offset === "number" ? a.offset : undefined,
      }),
  },
  {
    name: "get_prospect",
    description: "Détail d'un prospect, par identifiant ou par nom exact.",
    inputSchema: { type: "object", properties: { prospect: s("Identifiant ou nom exact du prospect") }, required: ["prospect"] },
    handler: (a) => getProspect(text(a, "prospect")),
  },
  {
    name: "add_prospects",
    description:
      "Ajoute un ou plusieurs prospects à la liste de prospection (200 au plus par appel). Seul le nom est obligatoire. " +
      "Un prospect déjà présent (même nom et même téléphone) n'est pas dupliqué : la réponse liste ce qui a été ajouté, ignoré (doublon) ou refusé (donnée invalide, avec la raison). " +
      "N'invente aucune information : laisse vide ce que tu ne sais pas. Passe soit `prospects` (liste), soit directement les champs d'un seul prospect.",
    inputSchema: {
      type: "object",
      properties: {
        prospects: {
          type: "array",
          description: "Liste de prospects à ajouter",
          items: {
            type: "object",
            properties: {
              name: s("Nom du commerce (obligatoire)"),
              activity: s("Activité, ex. « Salon de coiffure »"),
              phone: s("Téléphone, ex. « 02 99 06 40 36 »"),
              email: s("Adresse e-mail du commerce (un prospect ayant le même e-mail n'est pas dupliqué)"),
              website: s("Adresse de son site actuel, ex. « exemple.fr » (http ou https)"),
              address: s("Adresse postale complète avec code postal et ville (200 car. max) : elle place le commerce sur la carte"),
              city: s("Ville (sinon déduite de l'adresse)"),
              notes: s("Notes libres (2 000 car. max)"),
              rating: s("Note Google, ex. « 4,8 »"),
              category: s("Catégorie, ex. « A. Aucun site »"),
              priority: s("Priorité", { enum: [...PROSPECT_PRIORITIES] }),
              finding: s("Constat sur son site actuel (1 000 car. max)"),
              status: s("Statut (new par défaut)", { enum: [...PROSPECT_STATUSES] }),
              tags: { type: "array", items: { type: "string", enum: prospectTags.map((t) => t.id) }, description: "Cases de suivi à cocher" },
            },
            required: ["name"],
          },
        },
        name: s("Pour ajouter un seul prospect : son nom (avec les mêmes champs facultatifs que ci-dessus)"),
      },
    },
    handler: (a) => {
      const result = addProspects(Array.isArray(a.prospects) ? a.prospects : a.name ? [a] : []);
      void geocodeProspects();
      return result;
    },
  },
  {
    name: "update_prospect",
    description:
      "Modifie un prospect (par identifiant ou nom exact) : son statut, ses cases de suivi (`tags` remplace tout, `add_tags` et `remove_tags` ajoutent ou retirent) " +
      "et ses champs descriptifs. Seuls les champs fournis changent.",
    inputSchema: {
      type: "object",
      properties: {
        prospect: s("Identifiant ou nom exact du prospect"),
        status: s("Nouveau statut", { enum: [...PROSPECT_STATUSES] }),
        tags: { type: "array", items: { type: "string", enum: prospectTags.map((t) => t.id) }, description: "Remplace toutes les cases cochées" },
        add_tags: { type: "array", items: { type: "string", enum: prospectTags.map((t) => t.id) }, description: "Cases à cocher" },
        remove_tags: { type: "array", items: { type: "string", enum: prospectTags.map((t) => t.id) }, description: "Cases à décocher" },
        name: s("Nouveau nom"),
        activity: s("Activité"),
        phone: s("Téléphone"),
        email: s("Adresse e-mail (chaîne vide pour l'effacer)"),
        website: s("Adresse de son site actuel (chaîne vide pour l'effacer)"),
        address: s("Adresse postale complète avec code postal et ville : elle place le commerce sur la carte"),
        city: s("Ville (sinon déduite de l'adresse)"),
        notes: s("Notes libres (remplacent les anciennes)"),
        rating: s("Note Google"),
        category: s("Catégorie"),
        priority: s("Priorité", { enum: [...PROSPECT_PRIORITIES] }),
        finding: s("Constat (remplace l'ancien)"),
      },
      required: ["prospect"],
    },
    handler: (a) => {
      const { prospect, ...patch } = a;
      const result = updateProspect(text({ prospect }, "prospect"), patch);
      void geocodeProspects();
      return result;
    },
  },
  {
    name: "tag_prospects",
    description:
      "Range plusieurs entreprises d'un coup dans une ou plusieurs catégories de suivi (cases) : " +
      prospectTags.map((t) => `\`${t.id}\` = ${t.label}`).join(", ") +
      ". Exemple : après avoir envoyé un e-mail à des entreprises, coche `mail` pour toutes (add_tags). " +
      "Les entreprises se désignent par identifiant ou nom exact (200 au plus par appel) ; les cases déjà cochées le restent, " +
      "et `remove_tags` en décoche. Une référence introuvable ou ambiguë n'empêche pas les autres : elle est listée avec la raison. " +
      "Pour une seule entreprise avec d'autres changements, utilise update_prospect.",
    inputSchema: {
      type: "object",
      properties: {
        prospects: { type: "array", items: { type: "string" }, description: "Identifiants ou noms exacts des entreprises" },
        add_tags: { type: "array", items: { type: "string", enum: prospectTags.map((t) => t.id) }, description: "Catégories à cocher" },
        remove_tags: { type: "array", items: { type: "string", enum: prospectTags.map((t) => t.id) }, description: "Catégories à décocher" },
      },
      required: ["prospects"],
    },
    handler: (a) => {
      const result = tagProspects(Array.isArray(a.prospects) ? a.prospects : [], { add: a.add_tags, remove: a.remove_tags });
      if (result.updated > 0) {
        audit("mcp", "prospect.tag", `${result.updated} fiche(s) : +${JSON.stringify(a.add_tags ?? [])} -${JSON.stringify(a.remove_tags ?? [])}`.slice(0, 500));
      }
      return result;
    },
  },
  {
    name: "delete_prospects",
    description:
      "SUPPRIME DÉFINITIVEMENT des prospects de la liste de prospection (200 au plus par appel). Action irréversible : n'appelle cet outil que sur demande explicite de l'administrateur, " +
      "après lui avoir montré la liste exacte des prospects visés (list_prospects), et passe `confirm: true`. Les prospects se désignent par identifiant ou par nom exact. " +
      "La réponse liste ce qui a été supprimé et ce qui n'a pas été trouvé. Ne supprime jamais tous les prospects « pour faire du ménage » sans demande précise.",
    inputSchema: {
      type: "object",
      properties: {
        prospects: { type: "array", items: { type: "string" }, description: "Identifiants ou noms exacts des prospects à supprimer" },
        confirm: { type: "boolean", description: "Doit valoir true : confirme que l'administrateur a demandé cette suppression" },
      },
      required: ["prospects", "confirm"],
    },
    handler: (a) => {
      if (a.confirm !== true) {
        throw new DataError("Suppression non confirmée : demande d'abord son accord à l'administrateur, puis rappelle l'outil avec confirm: true.");
      }
      const result = deleteProspects(Array.isArray(a.prospects) ? a.prospects : []);
      if (result.deleted > 0) {
        audit("mcp", "prospect.delete", result.deletedItems.map((p) => p.name).join(", ").slice(0, 500));
      }
      return result;
    },
  },
  {
    name: "list_leads",
    description: "Liste les demandes de devis reçues via le site vitrine (prospects ENTRANTS, qui ont fait la demande : à ne pas confondre avec list_prospects, la prospection à froid).",
    inputSchema: { type: "object", properties: {} },
    handler: () => all<LeadRow>("SELECT id, name, email, company, message, estimate, status, created_at FROM leads ORDER BY created_at DESC LIMIT 100"),
  },
];

/** Tous les outils : le cœur (clients, sites, prospection) et l'administration (comptes, domaines, devis, messagerie). */
export const tools: Tool[] = [...coreTools, ...adminTools];
