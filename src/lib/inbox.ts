import "server-only";
import { randomUUID } from "node:crypto";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import MailComposer from "nodemailer/lib/mail-composer";
import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { all, get, newId, run } from "./db";

/**
 * Messagerie partagée entre les administrateurs.
 * La boîte mail (IMAP) est copiée en local (tables mail_*) : conversations, dossiers et récapitulatif sont donc communs
 * à tous les admins. Réglages dans .env.local : IMAP_HOST (sinon déduit de SMTP_HOST : smtp.x → imap.x), IMAP_PORT (993),
 * IMAP_USER / IMAP_PASS (sinon SMTP_USER / SMTP_PASS). L'envoi réutilise les réglages SMTP.
 * Seul le texte des messages est affiché : ni HTML, ni image distante, ni script.
 */
const env = process.env;
const host = env.IMAP_HOST || (env.SMTP_HOST ?? "").replace(/^smtp\./, "imap.");
const user = env.IMAP_USER || env.SMTP_USER || "";
const pass = env.IMAP_PASS || env.SMTP_PASS || "";

export const inboxConfigured = Boolean(host && user && pass);
export const inboxAddress = user;

export type MailMessage = {
  id: string;
  thread_id: string;
  box: "inbox" | "sent";
  uid: number | null;
  message_id: string;
  from_addr: string;
  to_addr: string;
  subject: string;
  date: string;
  body: string;
  html: string;
  seen: number;
  sent_by: string;
};
export type MailFolder = { id: string; name: string; parent_id: string | null };

/* ---------- Connexion IMAP ---------- */
async function withClient<T>(fn: (c: ImapFlow) => Promise<T>): Promise<T> {
  const port = Number(env.IMAP_PORT) || 993;
  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    logger: false,
    socketTimeout: 60_000,
    greetingTimeout: 15_000,
    connectionTimeout: 15_000,
  });
  client.on("error", () => {}); // l'erreur remonte par la promesse en cours
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => {});
  }
}

async function specialPath(c: ImapFlow, use: "\\Sent" | "\\Trash"): Promise<string | null> {
  const boxes = await c.list();
  const byUse = boxes.find((b) => b.specialUse === use);
  if (byUse) return byUse.path;
  const names = use === "\\Sent" ? ["sent", "sent items", "éléments envoyés", "envoyés"] : ["trash", "deleted items", "corbeille"];
  return boxes.find((b) => names.includes(b.name.toLowerCase()))?.path ?? null;
}

/* ---------- Utilitaires ---------- */
const cleanId = (s: string) => s.trim();
/** « Re: Fwd: Devis » → « devis » : sert à rattacher un message à sa conversation quand les en-têtes manquent. */
export const normalizeSubject = (s: string) => s.replace(/^\s*((re|fw|fwd|tr)\s*:\s*)+/i, "").trim().toLowerCase();
export const emailOf = (s: string) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase();

const htmlToText = (html: string) =>
  html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Nettoie le HTML d'un e-mail pour l'afficher tel que reçu : scripts, formulaires, cadres et gestionnaires d'événements
 * sont retirés, les liens s'ouvrent dans un nouvel onglet. Les images « cid: » jointes au message sont intégrées.
 * L'affichage se fait en plus dans un cadre isolé avec sa propre politique de sécurité (voir /api/mail-html).
 */
function cleanEmailHtml(html: string, attachments: { cid?: string; contentType: string; content: Buffer; size: number }[]): string {
  let src = html;
  let embedded = 0;
  for (const a of attachments) {
    if (!a.cid || !a.contentType.startsWith("image/") || a.contentType.includes("svg") || a.size > 1_500_000 || embedded >= 20) continue;
    const cid = a.cid.replace(/^<|>$/g, "");
    const uri = `data:${a.contentType};base64,${a.content.toString("base64")}`;
    src = src.split(`cid:${cid}`).join(uri);
    embedded++;
  }
  const out = sanitizeHtml(src, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "font", "center", "style", "h1", "h2", "span", "u", "s", "small", "big", "hr", "figure", "figcaption", "section", "article", "header", "footer"],
    allowedAttributes: {
      "*": ["style", "class", "align", "valign", "width", "height", "bgcolor", "color", "dir", "lang", "title", "colspan", "rowspan", "cellpadding", "cellspacing", "border"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height", "style", "align", "border"],
      font: ["color", "face", "size"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowVulnerableTags: true,
    transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer nofollow" }) },
  });
  return out.length > 400_000 ? "" : out;
}

/** Trouve (ou crée) la conversation d'un message : par en-têtes de réponse, sinon par objet + correspondant. */
function threadFor(m: { message_id: string; in_reply_to: string; refs: string; subject: string; from_addr: string; to_addr: string; box: string }): string {
  const ids = [m.in_reply_to, ...m.refs.split(/\s+/)].map(cleanId).filter(Boolean);
  for (const id of ids) {
    const hit = get<{ thread_id: string }>("SELECT thread_id FROM mail_messages WHERE message_id = ?", id);
    if (hit) return hit.thread_id;
  }
  // Un message dont un autre message de la boîte répond à son identifiant
  if (m.message_id) {
    const child = get<{ thread_id: string }>("SELECT thread_id FROM mail_messages WHERE in_reply_to = ? OR (' ' || refs || ' ') LIKE ?", m.message_id, `% ${m.message_id} %`);
    if (child) return child.thread_id;
  }
  const norm = normalizeSubject(m.subject);
  if (norm) {
    const other = emailOf(m.box === "sent" ? m.to_addr : m.from_addr);
    const cand = all<{ thread_id: string; subject: string; from_addr: string; to_addr: string }>(
      "SELECT thread_id, subject, from_addr, to_addr FROM mail_messages WHERE lower(subject) LIKE ? ORDER BY date DESC LIMIT 50",
      `%${norm.replace(/[%_]/g, "")}%`
    );
    const hit = cand.find((c) => normalizeSubject(c.subject) === norm && (emailOf(c.from_addr) === other || emailOf(c.to_addr).includes(other)));
    if (hit) return hit.thread_id;
  }
  const id = newId();
  run("INSERT INTO mail_threads (id, subject, last_at) VALUES (?, ?, ?)", id, m.subject.replace(/^\s*((re|fw|fwd|tr)\s*:\s*)+/i, "").trim().slice(0, 200), new Date().toISOString());
  return id;
}

function storeMessage(m: Omit<MailMessage, "id" | "thread_id"> & { in_reply_to: string; refs: string }): void {
  // Le message envoyé depuis l'application est déjà enregistré : on y rattache simplement son numéro IMAP.
  if (m.message_id) {
    const known = get<{ id: string }>("SELECT id FROM mail_messages WHERE message_id = ? AND box = ?", m.message_id, m.box);
    if (known) {
      run("UPDATE mail_messages SET uid = COALESCE(uid, ?) WHERE id = ?", m.uid, known.id);
      return;
    }
  }
  if (m.uid !== null && get("SELECT 1 FROM mail_messages WHERE box = ? AND uid = ?", m.box, m.uid)) return;
  const thread = threadFor(m);
  run(
    "INSERT INTO mail_messages (id, thread_id, box, uid, message_id, in_reply_to, refs, from_addr, to_addr, subject, date, body, html, seen, sent_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    newId(), thread, m.box, m.uid, m.message_id, m.in_reply_to, m.refs, m.from_addr, m.to_addr, m.subject, m.date, m.body, m.html, m.seen, m.sent_by
  );
  // Un nouveau message (reçu ou envoyé) rouvre la conversation : elle redevient « à traiter » ou « en attente ».
  run("UPDATE mail_threads SET last_at = MAX(last_at, ?), status = 'open' WHERE id = ?", m.date, thread);
}

/* ---------- Synchronisation ---------- */
let lastSync = 0;
let syncing: Promise<void> | null = null;
const FIRST_SYNC = 300; // à la première synchronisation : les 300 messages les plus récents de chaque dossier

async function syncBox(c: ImapFlow, path: string, box: "inbox" | "sent") {
  const lock = await c.getMailboxLock(path);
  try {
    const maxUid = get<{ m: number | null }>("SELECT MAX(uid) AS m FROM mail_messages WHERE box = ?", box)?.m ?? 0;
    let uids = ((await c.search(maxUid ? { uid: `${maxUid + 1}:*` } : { all: true }, { uid: true })) || []) as number[];
    uids = uids.filter((u) => u > maxUid).sort((a, b) => a - b);
    if (!maxUid) uids = uids.slice(-FIRST_SYNC);
    for (const uid of uids) {
      const msg = await c.fetchOne(String(uid), { uid: true, source: true, flags: true }, { uid: true });
      if (!msg || !msg.source) continue;
      const p = await simpleParser(msg.source);
      const refs = Array.isArray(p.references) ? p.references.join(" ") : (p.references ?? "");
      storeMessage({
        box,
        uid,
        message_id: p.messageId ?? "",
        in_reply_to: p.inReplyTo ?? "",
        refs,
        from_addr: p.from?.text ?? "",
        to_addr: (Array.isArray(p.to) ? p.to.map((t) => t.text).join(", ") : p.to?.text) ?? "",
        subject: (p.subject ?? "").slice(0, 300),
        date: new Date(p.date ?? Date.now()).toISOString(),
        body: (p.text?.trim() || (typeof p.html === "string" ? htmlToText(p.html) : "")).slice(0, 100_000),
        html: typeof p.html === "string" ? cleanEmailHtml(p.html, p.attachments) : "",
        seen: box === "sent" || msg.flags?.has("\\Seen") ? 1 : 0,
        sent_by: "",
      });
    }
  } finally {
    lock.release();
  }
}

/** Récupère les nouveaux messages (au plus une fois par minute, sauf demande explicite). */
export async function syncMailbox(force = false): Promise<void> {
  if (!inboxConfigured) return;
  if (syncing) return syncing;
  if (!force && Date.now() - lastSync < 60_000) return;
  syncing = withClient(async (c) => {
    await syncBox(c, "INBOX", "inbox");
    const sent = await specialPath(c, "\\Sent");
    if (sent) await syncBox(c, sent, "sent");
    lastSync = Date.now();
  }).finally(() => {
    syncing = null;
  });
  return syncing;
}

/* ---------- Lecture ---------- */
export type ThreadRow = {
  id: string;
  subject: string;
  status: "open" | "done";
  folder_id: string | null;
  folder_name: string | null;
  last_at: string;
  n: number;
  unread: number;
  last_box: "inbox" | "sent";
  last_from: string;
  last_to: string;
  last_by: string;
  last_body: string;
};

/**
 * Vues de suivi :
 *  - nonlus : au moins un message reçu non lu
 *  - atraiter : le correspondant a écrit en dernier, la conversation n'est pas traitée
 *  - attente : nous avons écrit en dernier, on attend sa réponse
 *  - traites : conversations marquées traitées
 */
export type MailView = "tous" | "nonlus" | "atraiter" | "attente" | "traites";
export const mailViews: { id: MailView; label: string }[] = [
  { id: "atraiter", label: "À traiter" },
  { id: "attente", label: "En attente de réponse" },
  { id: "nonlus", label: "Non lus" },
  { id: "traites", label: "Traitées" },
  { id: "tous", label: "Toutes" },
];

const LAST = (col: string) => `(SELECT ${col} FROM mail_messages m WHERE m.thread_id = t.id ORDER BY date DESC LIMIT 1)`;
const viewSql: Record<MailView, string> = {
  tous: "1=1",
  nonlus: "EXISTS (SELECT 1 FROM mail_messages m WHERE m.thread_id = t.id AND m.box = 'inbox' AND m.seen = 0)",
  atraiter: `t.status = 'open' AND ${LAST("box")} = 'inbox'`,
  attente: `t.status = 'open' AND ${LAST("box")} = 'sent'`,
  traites: "t.status = 'done'",
};
export const isMailView = (v: string): v is MailView => v in viewSql;

export function viewCounts(): Record<MailView, number> {
  const out = {} as Record<MailView, number>;
  for (const v of Object.keys(viewSql) as MailView[]) {
    out[v] = get<{ n: number }>(`SELECT COUNT(*) AS n FROM mail_threads t WHERE ${viewSql[v]}`)?.n ?? 0;
  }
  return out;
}

/** Conversations, de la plus récente à la plus ancienne. `folder` : id de dossier, « none » (sans dossier) ou vide (toutes). */
export function listThreads(opts: { view?: MailView; folder?: string; query?: string; page: number; per: number }) {
  const where: string[] = [viewSql[opts.view ?? "tous"]];
  const params: (string | number)[] = [];
  if (opts.folder === "none") where.push("t.folder_id IS NULL");
  else if (opts.folder) {
    where.push("t.folder_id = ?");
    params.push(opts.folder);
  }
  if (opts.query) {
    where.push(
      "EXISTS (SELECT 1 FROM mail_messages m WHERE m.thread_id = t.id AND (m.subject LIKE ? OR m.from_addr LIKE ? OR m.to_addr LIKE ? OR m.body LIKE ?))"
    );
    const like = `%${opts.query.replace(/[%_]/g, "")}%`;
    params.push(like, like, like, like);
  }
  const w = `WHERE ${where.join(" AND ")}`;
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n FROM mail_threads t ${w}`, ...params)?.n ?? 0;
  const items = all<ThreadRow>(
    `SELECT t.id, t.subject, t.status, t.folder_id, f.name AS folder_name, t.last_at,
       (SELECT COUNT(*) FROM mail_messages m WHERE m.thread_id = t.id) AS n,
       (SELECT COUNT(*) FROM mail_messages m WHERE m.thread_id = t.id AND m.box = 'inbox' AND m.seen = 0) AS unread,
       ${LAST("box")} AS last_box, ${LAST("from_addr")} AS last_from, ${LAST("to_addr")} AS last_to, ${LAST("sent_by")} AS last_by,
       substr(${LAST("body")}, 1, 140) AS last_body
     FROM mail_threads t LEFT JOIN mail_folders f ON f.id = t.folder_id ${w}
     ORDER BY t.last_at DESC LIMIT ? OFFSET ?`,
    ...params, opts.per, (opts.page - 1) * opts.per
  );
  return { items, total, pages: Math.max(1, Math.ceil(total / opts.per)) };
}

/* ---------- Lien avec les prospects ---------- */
export type LinkedProspect = { id: string; name: string; status: string; tags: string; email: string };

/** Fiches prospects dont l'e-mail correspond (clé : adresse en minuscules). */
export function prospectsByEmail(emails: string[]): Map<string, LinkedProspect> {
  const map = new Map<string, LinkedProspect>();
  const uniq = [...new Set(emails.map((e) => e.toLowerCase()).filter(Boolean))];
  if (!uniq.length) return map;
  const rows = all<LinkedProspect>(`SELECT id, name, status, tags, email FROM prospects WHERE lower(email) IN (${uniq.map(() => "?").join(",")})`, ...uniq);
  for (const r of rows) map.set(r.email.toLowerCase(), r);
  return map;
}

/** Après un envoi à un prospect : coche « Mail envoyé » sur sa fiche. */
export function tagProspectMailSent(email: string): string | null {
  const p = get<{ id: string; name: string; tags: string }>("SELECT id, name, tags FROM prospects WHERE lower(email) = ?", email.toLowerCase());
  if (!p) return null;
  const tags = new Set(p.tags.split(",").filter(Boolean));
  tags.add("mail");
  run("UPDATE prospects SET tags = ?, updated_at = datetime('now') WHERE id = ?", [...tags].join(","), p.id);
  return p.name;
}

/* ---------- Statut et classement (un ou plusieurs fils) ---------- */
const idsClause = (ids: string[]) => ids.map(() => "?").join(",");
export function setThreadsStatus(ids: string[], status: "open" | "done") {
  if (ids.length) run(`UPDATE mail_threads SET status = ? WHERE id IN (${idsClause(ids)})`, status, ...ids);
}
export function moveThreads(ids: string[], folderId: string | null) {
  if (ids.length) run(`UPDATE mail_threads SET folder_id = ? WHERE id IN (${idsClause(ids)})`, folderId, ...ids);
}

export const listFolders = () =>
  all<MailFolder & { n: number; unread: number }>(
    `SELECT f.id, f.name, f.parent_id,
       (SELECT COUNT(*) FROM mail_threads t WHERE t.folder_id = f.id) AS n,
       (SELECT COUNT(*) FROM mail_messages m JOIN mail_threads t ON t.id = m.thread_id WHERE t.folder_id = f.id AND m.box = 'inbox' AND m.seen = 0) AS unread
     FROM mail_folders f ORDER BY lower(f.name)`
  );

export type FolderNode = MailFolder & { n: number; unread: number; depth: number; label: string; total: number; totalUnread: number };
export const MAX_FOLDER_DEPTH = 3; // racine = profondeur 0

/** Arborescence des dossiers, à plat et dans l'ordre d'affichage (parents suivis de leurs sous-dossiers). */
export function folderTree(): FolderNode[] {
  const flat = listFolders();
  const kids = new Map<string | null, typeof flat>();
  for (const f of flat) {
    const key = flat.some((p) => p.id === f.parent_id) ? f.parent_id : null;
    kids.set(key, [...(kids.get(key) ?? []), f]);
  }
  const out: FolderNode[] = [];
  const walk = (parent: string | null, depth: number, path: string): { total: number; unread: number } => {
    let total = 0;
    let unread = 0;
    for (const f of kids.get(parent) ?? []) {
      const label = path ? `${path} / ${f.name}` : f.name;
      const node: FolderNode = { ...f, depth, label, total: f.n, totalUnread: f.unread };
      out.push(node);
      const sub = walk(f.id, depth + 1, label);
      node.total += sub.total;
      node.totalUnread += sub.unread;
      total += node.total;
      unread += node.totalUnread;
    }
    return { total, unread };
  };
  walk(null, 0, "");
  return out;
}

/** Le dossier et tous ses sous-dossiers (pour afficher aussi leurs messages). */
export function folderWithDescendants(id: string): string[] {
  const flat = listFolders();
  const ids = [id];
  for (let i = 0; i < ids.length; i++) for (const f of flat) if (f.parent_id === ids[i] && !ids.includes(f.id)) ids.push(f.id);
  return ids;
}

export const mailCounts = () => ({
  threads: get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_threads")?.n ?? 0,
  unfiled: get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_threads WHERE folder_id IS NULL")?.n ?? 0,
  unread: get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_messages WHERE box = 'inbox' AND seen = 0")?.n ?? 0,
});

export function getThread(id: string) {
  const thread = get<{ id: string; subject: string; folder_id: string | null; status: "open" | "done" }>("SELECT id, subject, folder_id, status FROM mail_threads WHERE id = ?", id);
  if (!thread) return null;
  const messages = all<MailMessage>("SELECT * FROM mail_messages WHERE thread_id = ? ORDER BY date ASC", id);
  return { thread, messages };
}

export function markThreadSeen(id: string) {
  const unseen = all<{ uid: number | null }>("SELECT uid FROM mail_messages WHERE thread_id = ? AND box = 'inbox' AND seen = 0", id);
  if (!unseen.length) return;
  run("UPDATE mail_messages SET seen = 1 WHERE thread_id = ? AND box = 'inbox'", id);
  const uids = unseen.map((u) => u.uid).filter((u): u is number => u !== null);
  if (uids.length && inboxConfigured) {
    // Marquage « lu » sur le serveur de messagerie : sans importance si cela échoue.
    withClient(async (c) => {
      const lock = await c.getMailboxLock("INBOX");
      try {
        await c.messageFlagsAdd(uids.join(","), ["\\Seen"], { uid: true });
      } finally {
        lock.release();
      }
    }).catch(() => {});
  }
}

/** Récapitulatif : chaque mail envoyé, qui l'a envoyé et s'il a reçu une réponse. */
export function sentRecap(limit = 200) {
  return all<{ id: string; thread_id: string; to_addr: string; subject: string; date: string; sent_by: string; reply_at: string | null; reply_from: string | null }>(
    `SELECT s.id, s.thread_id, s.to_addr, s.subject, s.date, s.sent_by,
       (SELECT r.date FROM mail_messages r WHERE r.thread_id = s.thread_id AND r.box = 'inbox' AND r.date > s.date ORDER BY r.date ASC LIMIT 1) AS reply_at,
       (SELECT r.from_addr FROM mail_messages r WHERE r.thread_id = s.thread_id AND r.box = 'inbox' AND r.date > s.date ORDER BY r.date ASC LIMIT 1) AS reply_from
     FROM mail_messages s WHERE s.box = 'sent' ORDER BY s.date DESC LIMIT ?`,
    limit
  );
}

/** Réponses reçues : messages reçus dans une conversation où nous avions déjà écrit. */
export function repliesRecap(limit = 200) {
  return all<{ id: string; thread_id: string; from_addr: string; subject: string; date: string; seen: number; folder_name: string | null }>(
    `SELECT r.id, r.thread_id, r.from_addr, r.subject, r.date, r.seen, f.name AS folder_name
     FROM mail_messages r JOIN mail_threads t ON t.id = r.thread_id LEFT JOIN mail_folders f ON f.id = t.folder_id
     WHERE r.box = 'inbox' AND EXISTS (SELECT 1 FROM mail_messages s WHERE s.thread_id = r.thread_id AND s.box = 'sent' AND s.date < r.date)
     ORDER BY r.date DESC LIMIT ?`,
    limit
  );
}

export function recapTotals() {
  const sent = get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_messages WHERE box = 'sent'")?.n ?? 0;
  const answered =
    get<{ n: number }>(
      "SELECT COUNT(DISTINCT s.id) AS n FROM mail_messages s WHERE s.box = 'sent' AND EXISTS (SELECT 1 FROM mail_messages r WHERE r.thread_id = s.thread_id AND r.box = 'inbox' AND r.date > s.date)"
    )?.n ?? 0;
  return { sent, answered, waiting: sent - answered };
}

/* ---------- Écriture ---------- */
export function createFolder(name: string, by: string, parentId: string | null = null): MailFolder {
  const id = newId();
  run("INSERT INTO mail_folders (id, name, parent_id, created_by) VALUES (?, ?, ?, ?)", id, name, parentId, by);
  return { id, name, parent_id: parentId };
}
export const deleteFolder = (id: string) => run("DELETE FROM mail_folders WHERE id = ?", id);

/** Supprime la conversation ici et déplace ses messages dans la corbeille de la messagerie. */
export async function deleteThread(id: string): Promise<void> {
  const msgs = all<{ box: "inbox" | "sent"; uid: number | null }>("SELECT box, uid FROM mail_messages WHERE thread_id = ?", id);
  if (inboxConfigured && msgs.some((m) => m.uid !== null)) {
    await withClient(async (c) => {
      const trash = await specialPath(c, "\\Trash");
      const sent = await specialPath(c, "\\Sent");
      for (const box of ["inbox", "sent"] as const) {
        const uids = msgs.filter((m) => m.box === box && m.uid !== null).map((m) => m.uid as number);
        const path = box === "inbox" ? "INBOX" : sent;
        if (!uids.length || !path) continue;
        const lock = await c.getMailboxLock(path);
        try {
          if (trash && trash !== path) await c.messageMove(uids.join(","), trash, { uid: true });
          else await c.messageDelete(uids.join(","), { uid: true });
        } finally {
          lock.release();
        }
      }
    });
  }
  run("DELETE FROM mail_threads WHERE id = ?", id);
}

/* ---------- Vue « client de messagerie » : messages individuels ---------- */
export type MailListRow = {
  id: string;
  thread_id: string;
  box: "inbox" | "sent";
  from_addr: string;
  to_addr: string;
  subject: string;
  date: string;
  seen: number;
  snippet: string;
  has_html: number;
  folder_name: string | null;
};

/** Messages d'une boîte (reçus ou envoyés) ou d'un dossier personnalisé, filtrés par la recherche. */
export function listMailMessages(o: { box?: "inbox" | "sent"; folders?: string[]; query?: string; page: number; per: number }) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (o.box) {
    where.push("m.box = ?");
    params.push(o.box);
  }
  if (o.folders?.length) {
    where.push(`t.folder_id IN (${o.folders.map(() => "?").join(",")})`);
    params.push(...o.folders);
  }
  if (o.query) {
    where.push("(m.subject LIKE ? OR m.from_addr LIKE ? OR m.to_addr LIKE ? OR m.body LIKE ?)");
    const like = `%${o.query.replace(/[%_]/g, "")}%`;
    params.push(like, like, like, like);
  }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const from = "FROM mail_messages m JOIN mail_threads t ON t.id = m.thread_id LEFT JOIN mail_folders f ON f.id = t.folder_id";
  const total = get<{ n: number }>(`SELECT COUNT(*) AS n ${from} ${w}`, ...params)?.n ?? 0;
  const items = all<MailListRow>(
    `SELECT m.id, m.thread_id, m.box, m.from_addr, m.to_addr, m.subject, m.date, m.seen, substr(m.body, 1, 140) AS snippet,
       (m.html != '') AS has_html, f.name AS folder_name
     ${from} ${w} ORDER BY m.date DESC LIMIT ? OFFSET ?`,
    ...params, o.per, (o.page - 1) * o.per
  );
  return { items, total, pages: Math.max(1, Math.ceil(total / o.per)) };
}

export const boxCounts = () => ({
  inbox: get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_messages WHERE box = 'inbox'")?.n ?? 0,
  unread: get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_messages WHERE box = 'inbox' AND seen = 0")?.n ?? 0,
  sent: get<{ n: number }>("SELECT COUNT(*) AS n FROM mail_messages WHERE box = 'sent'")?.n ?? 0,
});

/** Un message, avec les autres messages de sa conversation. */
export function getMailMessage(id: string) {
  const message = get<MailMessage>("SELECT * FROM mail_messages WHERE id = ?", id);
  if (!message) return null;
  const thread = get<{ id: string; subject: string; folder_id: string | null }>("SELECT id, subject, folder_id FROM mail_threads WHERE id = ?", message.thread_id);
  const siblings = all<{ id: string; box: "inbox" | "sent"; from_addr: string; to_addr: string; date: string; sent_by: string }>(
    "SELECT id, box, from_addr, to_addr, date, sent_by FROM mail_messages WHERE thread_id = ? ORDER BY date ASC",
    message.thread_id
  );
  const refs = all<{ message_id: string }>("SELECT message_id FROM mail_messages WHERE thread_id = ? AND message_id != '' ORDER BY date ASC", message.thread_id).map((r) => r.message_id);
  return { message, thread, siblings, refs };
}

/** Le message le plus récent d'une conversation (pour les anciens liens). */
export const latestMessageOfThread = (threadId: string) =>
  get<{ id: string }>("SELECT id FROM mail_messages WHERE thread_id = ? ORDER BY date DESC LIMIT 1", threadId)?.id ?? null;

/** Marque des messages reçus lus ou non lus (ici, et sur le serveur de messagerie si possible). */
export function setMessagesSeen(ids: string[], seen: boolean) {
  if (!ids.length) return;
  const rows = all<{ uid: number | null }>(`SELECT uid FROM mail_messages WHERE id IN (${idsClause(ids)}) AND box = 'inbox'`, ...ids);
  run(`UPDATE mail_messages SET seen = ? WHERE id IN (${idsClause(ids)}) AND box = 'inbox'`, seen ? 1 : 0, ...ids);
  const uids = rows.map((r) => r.uid).filter((u): u is number => u !== null);
  if (uids.length && inboxConfigured) {
    withClient(async (c) => {
      const lock = await c.getMailboxLock("INBOX");
      try {
        if (seen) await c.messageFlagsAdd(uids.join(","), ["\\Seen"], { uid: true });
        else await c.messageFlagsRemove(uids.join(","), ["\\Seen"], { uid: true });
      } finally {
        lock.release();
      }
    }).catch(() => {});
  }
}

/** Supprime des messages : déplacés dans la corbeille de la messagerie, retirés d'ici. */
export async function deleteMessages(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const rows = all<{ id: string; box: "inbox" | "sent"; uid: number | null }>(`SELECT id, box, uid FROM mail_messages WHERE id IN (${idsClause(ids)})`, ...ids);
  if (inboxConfigured && rows.some((r) => r.uid !== null)) {
    await withClient(async (c) => {
      const trash = await specialPath(c, "\\Trash");
      const sent = await specialPath(c, "\\Sent");
      for (const box of ["inbox", "sent"] as const) {
        const uids = rows.filter((r) => r.box === box && r.uid !== null).map((r) => r.uid as number);
        const path = box === "inbox" ? "INBOX" : sent;
        if (!uids.length || !path) continue;
        const lock = await c.getMailboxLock(path);
        try {
          if (trash && trash !== path) await c.messageMove(uids.join(","), trash, { uid: true });
          else await c.messageDelete(uids.join(","), { uid: true });
        } finally {
          lock.release();
        }
      }
    });
  }
  run(`DELETE FROM mail_messages WHERE id IN (${idsClause(ids)})`, ...ids);
  run("DELETE FROM mail_threads WHERE id NOT IN (SELECT DISTINCT thread_id FROM mail_messages)");
}

/** Classe les conversations des messages donnés dans un dossier (ou les en sort). */
export function moveMessagesToFolder(ids: string[], folderId: string | null) {
  if (!ids.length) return;
  run(`UPDATE mail_threads SET folder_id = ? WHERE id IN (SELECT thread_id FROM mail_messages WHERE id IN (${idsClause(ids)}))`, folderId, ...ids);
}

/** Envoie un message (SMTP), l'enregistre dans la conversation et en garde une copie dans « Envoyés ». */
export async function sendFromInbox(m: { to: string; subject: string; text: string; by: string; inReplyTo?: string; references?: string }): Promise<string> {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT) || 587,
    secure: Number(env.SMTP_PORT) === 465,
    requireTLS: Number(env.SMTP_PORT) !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  const domain = (user.split("@")[1] || "axynweb.fr").replace(/[^a-z0-9.-]/gi, "");
  const messageId = `<${randomUUID()}@${domain}>`;
  const from = env.SMTP_FROM || user;
  const raw = await new MailComposer({
    from,
    to: m.to,
    subject: m.subject,
    text: m.text,
    messageId,
    inReplyTo: m.inReplyTo || undefined,
    references: m.references || undefined,
  })
    .compile()
    .build();
  await transporter.sendMail({ envelope: { from: user, to: [m.to] }, raw });

  const now = new Date().toISOString();
  storeMessage({
    box: "sent",
    uid: null,
    message_id: messageId,
    in_reply_to: m.inReplyTo ?? "",
    refs: m.references ?? "",
    from_addr: from,
    to_addr: m.to,
    subject: m.subject,
    date: now,
    body: m.text,
    html: "",
    seen: 1,
    sent_by: m.by,
  });
  const row = get<{ id: string; thread_id: string }>("SELECT id, thread_id FROM mail_messages WHERE message_id = ?", messageId);
  // La copie dans « Envoyés » est facultative : le message est déjà parti.
  try {
    await withClient(async (c) => {
      const sent = await specialPath(c, "\\Sent");
      if (sent) await c.append(sent, raw, ["\\Seen"]);
    });
  } catch {}
  return row?.thread_id ?? "";
}

