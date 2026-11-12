import "server-only";
import { z } from "zod";
import { all, get, newId, run, type DomainRow, type ProspectRow, type RequestRow, type SiteRow, type UserRow } from "./db";
import { parseDomainName } from "./hosts";
import { isProspectTag, parseTags, prospectTags } from "./prospect-tags";
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
export type DomainListItem = DomainRow & {
  site_name: string | null;
  site_status: SiteRow["status"] | null;
  days_left: number | null;
};

export function listDomains(clientId?: string) {
  const where = clientId ? "WHERE s.client_id = ?" : "";
  return all<DomainListItem>(
    `SELECT d.*, s.name AS site_name, s.status AS site_status,
            CAST(julianday(d.expires_at) - julianday('now') AS INTEGER) AS days_left
       FROM domains d LEFT JOIN sites s ON s.id = d.site_id ${where}
      ORDER BY d.expires_at IS NULL, d.expires_at ASC`,
    ...(clientId ? [clientId] : [])
  );
}

export function addDomain(input: { name: string; site?: string | null; registrar?: string; expiresAt?: string; autoRenew?: boolean }) {
  const parsed = parseDomainName(input.name);
  if (!parsed.ok) throw new DataError(parsed.error);
  const name = parsed.name;
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

/* ---------- Prospection à froid ---------- */
// Commerces repérés, sans demande de leur part (distincts des demandes de devis, table « leads »).
export const PROSPECT_STATUSES = ["new", "contacted", "won", "lost"] as const;
export const PROSPECT_PRIORITIES = ["Haute", "Normale", "À vérifier"] as const;
const MAX_PROSPECTS_PER_CALL = 200;

/** Un prospect tel que le voit le MCP : toutes les colonnes (dont e-mail, site, adresse, notes), les cases cochées en liste. */
export type ProspectView = Omit<ProspectRow, "tags"> & { tags: string[] };
const prospectView = (p: ProspectRow): ProspectView => ({ ...p, tags: parseTags(p.tags) });

const likePattern = (q: string) => "%" + q.replace(/[\\%_]/g, "\\$&") + "%";
const squash = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/** « haute », « a verifier »… → valeurs d'usage ; toute autre valeur est conservée telle quelle. */
function normalizePriority(v: unknown): string {
  const raw = squash(v, 30);
  const key = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return PROSPECT_PRIORITIES.find((p) => p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === key) ?? raw;
}

/** E-mail du prospect : vide autorisé, sinon une adresse valide, en minuscules. */
function checkEmail(v: unknown): string {
  const raw = squash(v, 120).toLowerCase();
  if (!raw) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) throw new DataError(`Adresse e-mail invalide : « ${raw} ».`);
  return raw;
}

/** Site actuel du commerce : vide autorisé, sinon une adresse http(s) ; « exemple.fr » devient « https://exemple.fr ». */
function checkWebsite(v: unknown): string {
  const raw = squash(v, 200);
  if (!raw) return "";
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new DataError(`Adresse de site invalide : « ${raw} ».`);
  }
  // Jamais de « javascript: » ou autre schéma : ce champ devient un lien cliquable dans l'admin.
  if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) throw new DataError(`Adresse de site invalide : « ${raw} » (http ou https attendu).`);
  return url.pathname === "/" && !url.search && !url.hash ? url.origin : url.href;
}

const checkNotes = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 2000) : "");

function checkTags(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new DataError("« tags » doit être une liste.");
  const out = new Set<string>();
  for (const t of v) {
    if (typeof t !== "string" || !isProspectTag(t)) {
      throw new DataError(`Case inconnue : ${JSON.stringify(t)}. Valeurs possibles : ${prospectTags.map((x) => x.id).join(", ")}.`);
    }
    out.add(t);
  }
  return [...out];
}

export function listProspects(f: { status?: string; tag?: string; category?: string; priority?: string; query?: string; limit?: number; offset?: number } = {}) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (f.status) {
    if (!(PROSPECT_STATUSES as readonly string[]).includes(f.status)) throw new DataError(`Statut inconnu. Valeurs : ${PROSPECT_STATUSES.join(", ")}.`);
    where.push("status = ?");
    params.push(f.status);
  }
  if (f.tag) {
    if (!isProspectTag(f.tag)) throw new DataError(`Case inconnue. Valeurs : ${prospectTags.map((x) => x.id).join(", ")}.`);
    where.push("(',' || tags || ',') LIKE ?");
    params.push(`%,${f.tag},%`);
  }
  if (f.category) {
    where.push("category LIKE ? ESCAPE '\\'");
    params.push(likePattern(f.category));
  }
  if (f.priority) {
    where.push("priority = ?");
    params.push(normalizePriority(f.priority));
  }
  if (f.query) {
    where.push(
      "(name LIKE ? ESCAPE '\\' OR activity LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR finding LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR website LIKE ? ESCAPE '\\' OR address LIKE ? ESCAPE '\\' OR notes LIKE ? ESCAPE '\\')"
    );
    const q = likePattern(f.query);
    params.push(q, q, q, q, q, q, q, q);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM prospects ${clause}`, ...params)?.n ?? 0;
  const limit = clamp(Math.trunc(f.limit ?? 50), 1, MAX_PROSPECTS_PER_CALL);
  const offset = Math.max(Math.trunc(f.offset ?? 0), 0);
  const rows = all<ProspectRow>(
    `SELECT * FROM prospects ${clause}
      ORDER BY CASE priority WHEN 'Haute' THEN 0 WHEN 'Normale' THEN 1 ELSE 2 END, rowid
      LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset
  );
  return { total, returned: rows.length, offset, items: rows.map(prospectView) };
}

const clamp = (n: number, a: number, b: number) => Math.min(Math.max(Number.isFinite(n) ? n : a, a), b);

/** Retrouve un prospect par identifiant, ou par nom exact (sans tenir compte de la casse). */
export function findProspect(idOrName: string): ProspectRow {
  const key = idOrName.trim();
  const byId = get<ProspectRow>("SELECT * FROM prospects WHERE id = ?", key);
  if (byId) return byId;
  const byName = all<ProspectRow>("SELECT * FROM prospects WHERE lower(name) = lower(?)", key);
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) throw new DataError(`Plusieurs prospects portent ce nom : précisez l'identifiant (${byName.map((p) => p.id).join(", ")}).`);
  throw new DataError("Prospect introuvable.");
}

export function getProspect(idOrName: string): ProspectView {
  return prospectView(findProspect(idOrName));
}

/**
 * Ajoute des prospects (200 au plus par appel). Un prospect déjà présent (même nom et même téléphone, sans tenir
 * compte de la casse) n'est pas dupliqué. Chaque ligne est contrôlée à part : les valides sont ajoutées, les autres
 * sont listées avec la raison.
 */
export function addProspects(items: unknown[]) {
  if (!Array.isArray(items) || items.length === 0) throw new DataError("Aucun prospect fourni.");
  if (items.length > MAX_PROSPECTS_PER_CALL) throw new DataError(`${MAX_PROSPECTS_PER_CALL} prospects au maximum par appel.`);

  const created: { id: string; name: string }[] = [];
  const skipped: { index: number; name: string; reason: string }[] = [];
  const rejected: { index: number; name: string; error: string }[] = [];
  const seen = new Set<string>();

  items.forEach((raw, index) => {
    const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const name = squash(o.name, 120);
    try {
      if (name.length < 2) throw new DataError("Nom manquant (2 caractères minimum).");
      const phone = squash(o.phone, 30);
      const status = squash(o.status, 20) || "new";
      if (!(PROSPECT_STATUSES as readonly string[]).includes(status)) throw new DataError(`Statut inconnu. Valeurs : ${PROSPECT_STATUSES.join(", ")}.`);
      const tags = checkTags(o.tags);
      const email = checkEmail(o.email);
      const website = checkWebsite(o.website);

      const key = `${name.toLowerCase()}|${phone}`;
      if (seen.has(key)) return void skipped.push({ index, name, reason: "doublon dans la liste fournie" });
      if (email && seen.has(`@${email}`)) return void skipped.push({ index, name, reason: "même e-mail qu'un autre prospect de la liste fournie" });
      seen.add(key);
      if (email) seen.add(`@${email}`);
      if (get("SELECT 1 AS x FROM prospects WHERE lower(name) = lower(?) AND phone = ?", name, phone)) {
        return void skipped.push({ index, name, reason: "déjà dans la liste" });
      }
      const sameEmail = email ? get<{ name: string }>("SELECT name FROM prospects WHERE email = ?", email) : undefined;
      if (sameEmail) return void skipped.push({ index, name, reason: `cet e-mail est déjà celui de « ${sameEmail.name} »` });

      const id = newId();
      run(
        "INSERT INTO prospects (id, category, priority, name, activity, phone, rating, finding, status, tags, email, website, address, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        id,
        squash(o.category, 80),
        normalizePriority(o.priority),
        name,
        squash(o.activity, 120),
        phone,
        squash(o.rating, 12),
        typeof o.finding === "string" ? o.finding.trim().slice(0, 1000) : "",
        status,
        tags.join(","),
        email,
        website,
        squash(o.address, 200),
        checkNotes(o.notes)
      );
      created.push({ id, name });
    } catch (e) {
      if (!(e instanceof DataError)) throw e;
      rejected.push({ index, name, error: e.message });
    }
  });
  return { added: created.length, skipped: skipped.length, rejected: rejected.length, created, skippedItems: skipped, rejectedItems: rejected };
}

/** Met à jour un prospect : statut, cases cochées (remplacer / ajouter / retirer) et champs descriptifs. */
export function updateProspect(idOrName: string, patch: Record<string, unknown>) {
  const p = findProspect(idOrName);
  const sets: string[] = [];
  const params: (string | number)[] = [];
  const set = (col: string, value: string) => {
    sets.push(`${col} = ?`);
    params.push(value);
  };

  if (patch.status !== undefined) {
    const status = squash(patch.status, 20);
    if (!(PROSPECT_STATUSES as readonly string[]).includes(status)) throw new DataError(`Statut inconnu. Valeurs : ${PROSPECT_STATUSES.join(", ")}.`);
    set("status", status);
  }
  if (patch.tags !== undefined || patch.add_tags !== undefined || patch.remove_tags !== undefined) {
    let tags = new Set<string>(patch.tags !== undefined ? checkTags(patch.tags) : parseTags(p.tags));
    for (const t of checkTags(patch.add_tags)) tags.add(t);
    for (const t of checkTags(patch.remove_tags)) tags.delete(t);
    tags = new Set([...tags].filter(isProspectTag));
    set("tags", [...tags].join(","));
  }
  if (patch.name !== undefined) {
    const name = squash(patch.name, 120);
    if (name.length < 2) throw new DataError("Nom invalide (2 caractères minimum).");
    set("name", name);
  }
  if (patch.activity !== undefined) set("activity", squash(patch.activity, 120));
  if (patch.phone !== undefined) set("phone", squash(patch.phone, 30));
  if (patch.rating !== undefined) set("rating", squash(patch.rating, 12));
  if (patch.category !== undefined) set("category", squash(patch.category, 80));
  if (patch.priority !== undefined) set("priority", normalizePriority(patch.priority));
  if (patch.finding !== undefined) set("finding", typeof patch.finding === "string" ? patch.finding.trim().slice(0, 1000) : "");
  if (patch.email !== undefined) set("email", checkEmail(patch.email));
  if (patch.website !== undefined) set("website", checkWebsite(patch.website));
  if (patch.address !== undefined) set("address", squash(patch.address, 200));
  if (patch.notes !== undefined) set("notes", checkNotes(patch.notes));

  if (sets.length === 0) throw new DataError("Rien à modifier : fournissez au moins un champ.");
  try {
    run(`UPDATE prospects SET ${sets.join(", ")}, updated_at = datetime('now') WHERE id = ?`, ...params, p.id);
  } catch {
    throw new DataError("Un prospect avec ce nom et ce téléphone existe déjà.");
  }
  return getProspect(p.id);
}

/**
 * Supprime des prospects (200 au plus par appel), désignés par identifiant ou par nom exact. Définitif.
 * Une référence introuvable ou ambiguë n'empêche pas les autres : elle est listée avec la raison.
 */
export function deleteProspects(refs: unknown[]) {
  if (!Array.isArray(refs) || refs.length === 0) throw new DataError("Aucun prospect désigné.");
  if (refs.length > MAX_PROSPECTS_PER_CALL) throw new DataError(`${MAX_PROSPECTS_PER_CALL} prospects au maximum par appel.`);

  const found = new Map<string, ProspectRow>();
  const failed: { ref: string; error: string }[] = [];
  for (const raw of refs) {
    const ref = typeof raw === "string" ? raw.trim() : "";
    if (!ref) {
      failed.push({ ref: String(raw), error: "Référence vide." });
      continue;
    }
    try {
      const p = findProspect(ref);
      found.set(p.id, p);
    } catch (e) {
      if (!(e instanceof DataError)) throw e;
      failed.push({ ref, error: e.message });
    }
  }
  for (const id of found.keys()) run("DELETE FROM prospects WHERE id = ?", id);
  return {
    deleted: found.size,
    deletedItems: [...found.values()].map((p) => ({ id: p.id, name: p.name, phone: p.phone })),
    failed: failed.length,
    failedItems: failed,
  };
}

/* ---------- Vue d'ensemble ---------- */
export function overview() {
  const n = (sql: string) => (get<{ n: number }>(sql)?.n ?? 0);
  const tagCount = (tag: string) => n(`SELECT COUNT(*) AS n FROM prospects WHERE (',' || tags || ',') LIKE '%,${tag},%'`);
  return {
    prospects: {
      total: n("SELECT COUNT(*) AS n FROM prospects"),
      ...Object.fromEntries(PROSPECT_STATUSES.map((s) => [s, n(`SELECT COUNT(*) AS n FROM prospects WHERE status = '${s}'`)])),
      aRappeler: tagCount("rappeler"),
      entretien: tagCount("entretien"),
      vusEnPresentiel: tagCount("presentiel"),
      aRepasser: tagCount("repasser"),
      mailEnvoye: tagCount("mail"),
    },
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
