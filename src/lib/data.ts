import "server-only";
import { z } from "zod";
import { all, get, newId, run, type DomainRow, type RequestRow, type SiteRow, type UserRow } from "./db";
import { hashPassword, randomToken } from "./password";
import { contentFields, getTemplate, photoSlots, resolveContent, type SiteContent } from "./templates";

/**
 * Opérations métier partagées par l'espace admin (Server Actions) et le
 * serveur MCP : une seule implémentation, les mêmes validations partout.
 * Les fonctions lèvent `DataError` avec un message lisible en cas de refus.
 */
export class DataError extends Error {}

export const MAX_HTML_BYTES = 1_500_000;
export const SITE_STATUSES = ["brief", "draft", "review", "live"] as const;
export const REQUEST_STATUSES = ["new", "in_progress", "done"] as const;

export const statusLabel: Record<string, string> = {
  brief: "Brief à traiter",
  draft: "Brouillon",
  review: "À valider",
  live: "En ligne",
  new: "Nouvelle",
  in_progress: "En cours",
  done: "Terminée",
  contacted: "Contacté",
  won: "Gagné",
  lost: "Perdu",
};

const nameSchema = z.string().trim().min(2).max(80);
const emailSchema = z.string().trim().toLowerCase().email().max(120);

export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "site";
}

function uniqueSlug(name: string): string {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; get("SELECT 1 AS x FROM sites WHERE slug = ?", slug); i++) slug = `${base}-${i}`;
  return slug;
}

/* ---------- Clients ---------- */
export function listClients() {
  return all<Pick<UserRow, "id" | "email" | "name" | "company" | "created_at" | "deletion_requested_at"> & { sites: number }>(
    `SELECT u.id, u.email, u.name, u.company, u.created_at, u.deletion_requested_at,
            (SELECT COUNT(*) FROM sites s WHERE s.client_id = u.id) AS sites
       FROM users u WHERE u.role = 'client' ORDER BY u.created_at DESC`
  );
}

/** Crée un compte client et renvoie un mot de passe provisoire (affiché une seule fois). */
export function createClient(input: { name: string; email: string; company?: string }) {
  const name = nameSchema.safeParse(input.name);
  const email = emailSchema.safeParse(input.email);
  if (!name.success) throw new DataError("Nom invalide (2 à 80 caractères).");
  if (!email.success) throw new DataError("Adresse e-mail invalide.");
  if (get("SELECT 1 AS x FROM users WHERE email = ?", email.data)) throw new DataError("Un compte existe déjà avec cet e-mail.");
  const id = newId();
  const password = randomToken(12);
  run(
    "INSERT INTO users (id, email, name, company, role, password_hash) VALUES (?, ?, ?, ?, 'client', ?)",
    id,
    email.data,
    name.data,
    (input.company ?? "").trim().slice(0, 120),
    hashPassword(password)
  );
  return { id, email: email.data, password };
}

export function findClientId(emailOrId: string | undefined | null): string | null {
  if (!emailOrId) return null;
  const row = get<{ id: string }>(
    "SELECT id FROM users WHERE role = 'client' AND (id = ? OR email = ?)",
    emailOrId,
    emailOrId.toLowerCase()
  );
  if (!row) throw new DataError(`Client introuvable : ${emailOrId}`);
  return row.id;
}

/* ---------- Sites ---------- */
export type SiteListItem = SiteRow & { client_name: string | null; client_email: string | null };

export function listSites(status?: string) {
  const where = status ? "WHERE s.status = ?" : "";
  return all<SiteListItem>(
    `SELECT s.*, u.name AS client_name, u.email AS client_email
       FROM sites s LEFT JOIN users u ON u.id = s.client_id ${where}
      ORDER BY s.updated_at DESC`,
    ...(status ? [status] : [])
  );
}

export function findSite(idOrSlug: string): SiteRow {
  const site = get<SiteRow>("SELECT * FROM sites WHERE id = ? OR slug = ?", idOrSlug, idOrSlug);
  if (!site) throw new DataError(`Site introuvable : ${idOrSlug}`);
  return site;
}

export function sanitizeContent(input: unknown): Partial<SiteContent> {
  const out: Partial<SiteContent> = {};
  if (!input || typeof input !== "object") return out;
  for (const f of contentFields) {
    const v = (input as Record<string, unknown>)[f.key];
    if (typeof v === "string") out[f.key] = v.trim().slice(0, f.max);
  }
  return out;
}

export function createSiteFromTemplate(input: {
  name: string;
  templateId: string;
  client?: string | null;
  content?: unknown;
}) {
  const name = nameSchema.safeParse(input.name);
  if (!name.success) throw new DataError("Nom de site invalide (2 à 80 caractères).");
  const template = getTemplate(input.templateId);
  if (!template) throw new DataError(`Modèle inconnu : ${input.templateId}`);
  const clientId = findClientId(input.client);
  const content = resolveContent(template, { brand: name.data, ...sanitizeContent(input.content) });
  const id = newId();
  const slug = uniqueSlug(name.data);
  run(
    "INSERT INTO sites (id, slug, name, client_id, kind, template_id, content, status) VALUES (?, ?, ?, ?, 'template', ?, ?, 'draft')",
    id,
    slug,
    name.data,
    clientId,
    template.id,
    JSON.stringify(content)
  );
  return { id, slug };
}

/** Enregistre un brief client : le site reste « à générer » jusqu'à réception du HTML. */
export function createSiteFromBrief(input: { name: string; brief: string; client?: string | null }) {
  const name = nameSchema.safeParse(input.name);
  if (!name.success) throw new DataError("Nom de site invalide (2 à 80 caractères).");
  const brief = input.brief.trim();
  if (brief.length < 20) throw new DataError("Le brief doit faire au moins 20 caractères.");
  const clientId = findClientId(input.client);
  const id = newId();
  const slug = uniqueSlug(name.data);
  run(
    "INSERT INTO sites (id, slug, name, client_id, kind, brief, status) VALUES (?, ?, ?, ?, 'custom', ?, 'brief')",
    id,
    slug,
    name.data,
    clientId,
    brief.slice(0, 8000)
  );
  return { id, slug };
}

export function setSiteHtml(idOrSlug: string, html: string) {
  const site = findSite(idOrSlug);
  if (site.kind !== "custom") throw new DataError("Ce site repose sur un modèle : modifiez son contenu, pas son HTML.");
  if (!/<html[\s>]/i.test(html)) throw new DataError("Le document doit être une page HTML complète (<html>…</html>).");
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new DataError("HTML trop volumineux (1,5 Mo maximum).");
  run(
    "UPDATE sites SET html = ?, status = CASE WHEN status = 'brief' THEN 'review' ELSE status END, updated_at = datetime('now') WHERE id = ?",
    html,
    site.id
  );
  return site;
}

export function updateSiteContent(idOrSlug: string, patch: unknown) {
  const site = findSite(idOrSlug);
  const template = getTemplate(site.template_id);
  if (site.kind !== "template" || !template) throw new DataError("Ce site n'a pas de contenu éditable par champs.");
  const merged = resolveContent(template, { ...resolveContent(template, site.content), ...sanitizeContent(patch) });
  run("UPDATE sites SET content = ?, updated_at = datetime('now') WHERE id = ?", JSON.stringify(merged), site.id);
  return site;
}

export function setSiteStatus(idOrSlug: string, status: string) {
  const site = findSite(idOrSlug);
  if (!(SITE_STATUSES as readonly string[]).includes(status)) throw new DataError("Statut invalide.");
  if (status !== "brief" && site.kind === "custom" && !site.html) {
    throw new DataError("Ce site n'a pas encore de page : fournissez d'abord son HTML.");
  }
  run("UPDATE sites SET status = ?, updated_at = datetime('now') WHERE id = ?", status, site.id);
  return site;
}

/* ---------- Domaines ---------- */
export type DomainListItem = DomainRow & { site_name: string | null; days_left: number | null };

export function listDomains(clientId?: string) {
  const where = clientId ? "WHERE s.client_id = ?" : "";
  return all<DomainListItem>(
    `SELECT d.*, s.name AS site_name,
            CAST(julianday(d.expires_at) - julianday('now') AS INTEGER) AS days_left
       FROM domains d LEFT JOIN sites s ON s.id = d.site_id ${where}
      ORDER BY d.expires_at IS NULL, d.expires_at ASC`,
    ...(clientId ? [clientId] : [])
  );
}

export function addDomain(input: { name: string; site?: string | null; registrar?: string; expiresAt?: string; autoRenew?: boolean }) {
  const name = input.name.trim().toLowerCase();
  if (!/^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(name)) {
    throw new DataError("Nom de domaine invalide (exemple : mon-site.fr).");
  }
  if (get("SELECT 1 AS x FROM domains WHERE name = ?", name)) throw new DataError("Ce domaine est déjà enregistré.");
  const expires = input.expiresAt?.trim() || null;
  if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) throw new DataError("Date d'expiration attendue au format AAAA-MM-JJ.");
  const siteId = input.site ? findSite(input.site).id : null;
  const id = newId();
  run(
    "INSERT INTO domains (id, site_id, name, registrar, expires_at, auto_renew) VALUES (?, ?, ?, ?, ?, ?)",
    id,
    siteId,
    name,
    (input.registrar ?? "").trim().slice(0, 60),
    expires,
    input.autoRenew === false ? 0 : 1
  );
  return { id, name };
}

/* ---------- Demandes de modification ---------- */
export type RequestListItem = RequestRow & { site_name: string; client_name: string | null };

export function listRequests(opts: { status?: string; clientId?: string } = {}) {
  const clauses: string[] = [];
  const params: string[] = [];
  if (opts.status) {
    clauses.push("r.status = ?");
    params.push(opts.status);
  }
  if (opts.clientId) {
    clauses.push("s.client_id = ?");
    params.push(opts.clientId);
  }
  return all<RequestListItem>(
    `SELECT r.*, s.name AS site_name, u.name AS client_name
       FROM requests r JOIN sites s ON s.id = r.site_id LEFT JOIN users u ON u.id = r.client_id
      ${clauses.length ? "WHERE " + clauses.join(" AND ") : ""}
      ORDER BY r.updated_at DESC`,
    ...params
  );
}

export function replyToRequest(requestId: string, author: { name: string; role: string }, body: string, status?: string) {
  const req = get<RequestRow>("SELECT * FROM requests WHERE id = ?", requestId);
  if (!req) throw new DataError("Demande introuvable.");
  const text = body.trim();
  if (text) {
    run(
      "INSERT INTO request_messages (id, request_id, author_name, author_role, body) VALUES (?, ?, ?, ?, ?)",
      newId(),
      req.id,
      author.name,
      author.role,
      text.slice(0, 4000)
    );
  }
  if (status) {
    if (!(REQUEST_STATUSES as readonly string[]).includes(status)) throw new DataError("Statut invalide.");
    run("UPDATE requests SET status = ? WHERE id = ?", status, req.id);
  }
  run("UPDATE requests SET updated_at = datetime('now') WHERE id = ?", req.id);
  return req;
}

/* ---------- Avancement d'un site ---------- */
export type ProgressStep = { label: string; done: boolean; hint: string };

/** Étapes entre la création et la mise en ligne : sert de fil conducteur à l'admin et au client. */
export function siteProgress(site: SiteRow): ProgressStep[] {
  const hasDomain = !!get("SELECT 1 AS x FROM domains WHERE site_id = ?", site.id);
  const steps: ProgressStep[] = [];
  const template = getTemplate(site.template_id);
  if (site.kind === "template" && template) {
    const content = resolveContent(template, site.content);
    const edited = contentFields.some((f) => f.key !== "brand" && content[f.key] !== template.content[f.key]);
    const photos = photoSlots.filter((s) => content[s.key]).length;
    steps.push({ label: "Textes personnalisés", done: edited, hint: "Remplacez les textes d'exemple du modèle." });
    steps.push({
      label: `Photos (${photos}/${photoSlots.length})`,
      done: photos === photoSlots.length,
      hint: "Ajoutez une photo dans chaque cadre.",
    });
  } else {
    steps.push({ label: "Page générée", done: !!site.html, hint: "Demandez à Claude de générer la page à partir du brief." });
  }
  steps.push({ label: "Client attribué", done: !!site.client_id, hint: "Rattachez le site à un compte client." });
  steps.push({ label: "Nom de domaine", done: hasDomain, hint: "Ajoutez le domaine dans l'onglet Domaines." });
  steps.push({ label: "En ligne", done: site.status === "live", hint: "Publiez le site quand tout est prêt." });
  return steps;
}

/** Nouveau mot de passe provisoire pour un client (affiché une seule fois) ; ferme ses sessions. */
export function resetClientPassword(clientId: string) {
  const user = get<UserRow>("SELECT * FROM users WHERE id = ? AND role = 'client'", clientId);
  if (!user) throw new DataError("Client introuvable.");
  const password = randomToken(12);
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(password), user.id);
  run("DELETE FROM sessions WHERE user_id = ?", user.id);
  return { email: user.email, password };
}

/* ---------- Vue d'ensemble ---------- */
export function overview() {
  const n = (sql: string) => (get<{ n: number }>(sql)?.n ?? 0);
  return {
    clients: n("SELECT COUNT(*) AS n FROM users WHERE role = 'client'"),
    sites: n("SELECT COUNT(*) AS n FROM sites"),
    sitesLive: n("SELECT COUNT(*) AS n FROM sites WHERE status = 'live'"),
    briefsPending: n("SELECT COUNT(*) AS n FROM sites WHERE status = 'brief'"),
    requestsOpen: n("SELECT COUNT(*) AS n FROM requests WHERE status != 'done'"),
    leadsNew: n("SELECT COUNT(*) AS n FROM leads WHERE status = 'new'"),
    domainsExpiring: n(
      "SELECT COUNT(*) AS n FROM domains WHERE expires_at IS NOT NULL AND julianday(expires_at) - julianday('now') < 30"
    ),
  };
}
