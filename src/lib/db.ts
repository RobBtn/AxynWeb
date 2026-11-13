import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password";
import { templates } from "./templates";

/**
 * Base SQLite locale (fichier data/webcrea.db), via le module natif de Node.
 * Toutes les requêtes sont préparées (paramètres liés) : pas d'injection SQL.
 */

const globalForDb = globalThis as unknown as { __webcreaDb?: DatabaseSync };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL CHECK (role IN ('admin','client')),
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deletion_requested_at TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('template','custom')),
  template_id TEXT,
  content TEXT NOT NULL DEFAULT '{}',
  html TEXT,
  brief TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('brief','draft','review','live')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  name TEXT NOT NULL UNIQUE,
  registrar TEXT NOT NULL DEFAULT '',
  expires_at TEXT,
  auto_renew INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  client_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','done')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS request_messages (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  estimate TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','won','lost')),
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Inscriptions en attente de vérification de l'e-mail : le compte n'existe qu'après saisie du code.
CREATE TABLE IF NOT EXISTS signup_codes (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  activity TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  rating TEXT NOT NULL DEFAULT '',
  finding TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','won','lost')),
  tags TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (name, phone)
);
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  revoked_at TEXT
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Messagerie partagée : copie locale de la boîte mail, regroupée en conversations et classée en dossiers.
CREATE TABLE IF NOT EXISTS mail_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES mail_folders(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS mail_threads (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT '',
  folder_id TEXT REFERENCES mail_folders(id) ON DELETE SET NULL,
  last_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS mail_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES mail_threads(id) ON DELETE CASCADE,
  box TEXT NOT NULL CHECK (box IN ('inbox','sent')),
  uid INTEGER,
  message_id TEXT NOT NULL DEFAULT '',
  in_reply_to TEXT NOT NULL DEFAULT '',
  refs TEXT NOT NULL DEFAULT '',
  from_addr TEXT NOT NULL DEFAULT '',
  to_addr TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL DEFAULT '',
  seen INTEGER NOT NULL DEFAULT 0,
  sent_by TEXT NOT NULL DEFAULT '',
  UNIQUE (box, uid)
);
CREATE INDEX IF NOT EXISTS idx_mail_msg_thread ON mail_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_msg_mid ON mail_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_sites_client ON sites(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_site ON requests(site_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
`;

function seed(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (count.n > 0) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn(
      "[axynweb] ADMIN_EMAIL / ADMIN_PASSWORD absents de .env.local : aucun compte administrateur créé."
    );
    return;
  }

  const insertUser = db.prepare(
    "INSERT INTO users (id, email, name, company, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)"
  );
  insertUser.run(randomUUID(), adminEmail.toLowerCase(), "Administrateur", "AxynWeb", "admin", hashPassword(adminPassword));

  // Données de démonstration (supprimables depuis l'espace admin).
  const demoEmail = process.env.DEMO_CLIENT_EMAIL;
  const demoPassword = process.env.DEMO_CLIENT_PASSWORD;
  if (!demoEmail || !demoPassword) return;

  const clientId = randomUUID();
  insertUser.run(clientId, demoEmail.toLowerCase(), "Camille Martin", "Maison Brume (démo)", "client", hashPassword(demoPassword));

  const tpl = templates[0];
  const siteId = randomUUID();
  db.prepare(
    "INSERT INTO sites (id, slug, name, client_id, kind, template_id, content, status) VALUES (?, ?, ?, ?, 'template', ?, ?, 'live')"
  ).run(siteId, "maison-brume", "Maison Brume", clientId, tpl.id, JSON.stringify({ ...tpl.content, brand: "Maison Brume" }));

  db.prepare(
    "INSERT INTO domains (id, site_id, name, registrar, expires_at, auto_renew) VALUES (?, ?, ?, ?, date('now', '+21 days'), 0)"
  ).run(randomUUID(), siteId, "maison-brume.example", "OVHcloud");

  const requestId = randomUUID();
  db.prepare(
    "INSERT INTO requests (id, site_id, client_id, title, body, status) VALUES (?, ?, ?, ?, ?, 'new')"
  ).run(requestId, siteId, clientId, "Ajouter les horaires d'été", "Bonjour, pouvez-vous ajouter nos horaires d'été en bas de page ? Merci !");
}

/**
 * Purge automatique, alignée sur la politique de confidentialité : demandes de devis 3 ans, journal 12 mois,
 * prospects à froid 3 ans après leur dernière modification (hors clients gagnés), codes et sessions expirés.
 * Exécutée à l'ouverture de la base puis une fois par jour.
 */
export function purgeExpired(db: DatabaseSync = getDb()) {
  const now = Date.now();
  const n = (sql: string, ...p: number[]) => Number(db.prepare(sql).run(...p).changes);
  const leads = n("DELETE FROM leads WHERE created_at < datetime('now', '-3 years')");
  const prospects = n(
    "DELETE FROM prospects WHERE status != 'won' AND COALESCE(NULLIF(updated_at, ''), created_at) < datetime('now', '-3 years')"
  );
  const audit = n("DELETE FROM audit WHERE created_at < datetime('now', '-12 months') AND action != 'purge'");
  n("DELETE FROM mail_threads WHERE last_at < datetime('now', '-3 years')");
  n("DELETE FROM signup_codes WHERE expires_at < ?", now);
  n("DELETE FROM sessions WHERE expires_at < ?", now);
  if (leads || prospects || audit) {
    db.prepare("INSERT INTO audit (actor, action, detail) VALUES ('system', 'purge', ?)").run(
      `${leads} demande(s) de devis, ${prospects} prospect(s), ${audit} entrée(s) de journal supprimés`
    );
  }
  return { leads, prospects, audit };
}

export function getDb(): DatabaseSync {
  if (globalForDb.__webcreaDb) return globalForDb.__webcreaDb;
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "webcrea.db"));
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  db.exec(SCHEMA);
  // Migration : ces colonnes ont été ajoutées après la création de la table sur les bases existantes.
  const prospectCols = (db.prepare("PRAGMA table_info(prospects)").all() as { name: string }[]).map((c) => c.name);
  for (const col of ["tags", "email", "website", "address", "notes", "updated_at"]) {
    if (!prospectCols.includes(col)) db.exec(`ALTER TABLE prospects ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`);
  }
  const threadCols = (db.prepare("PRAGMA table_info(mail_threads)").all() as { name: string }[]).map((c) => c.name);
  if (!threadCols.includes("status")) db.exec("ALTER TABLE mail_threads ADD COLUMN status TEXT NOT NULL DEFAULT 'open'");
  const folderCols = (db.prepare("PRAGMA table_info(mail_folders)").all() as { name: string }[]).map((c) => c.name);
  if (!folderCols.includes("parent_id")) db.exec("ALTER TABLE mail_folders ADD COLUMN parent_id TEXT REFERENCES mail_folders(id) ON DELETE CASCADE");
  const msgCols = (db.prepare("PRAGMA table_info(mail_messages)").all() as { name: string }[]).map((c) => c.name);
  if (!msgCols.includes("html")) db.exec("ALTER TABLE mail_messages ADD COLUMN html TEXT NOT NULL DEFAULT ''");
  const userCols = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((c) => c.name);
  if (!userCols.includes("google_sub")) db.exec("ALTER TABLE users ADD COLUMN google_sub TEXT");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL");
  purgeExpired(db);
  setInterval(() => purgeExpired(db), 24 * 3600 * 1000).unref();
  seed(db);
  globalForDb.__webcreaDb = db;
  return db;
}

/** Raccourcis typés. */
export function all<T>(sql: string, ...params: (string | number | null)[]): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}
export function get<T>(sql: string, ...params: (string | number | null)[]): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}
export function run(sql: string, ...params: (string | number | null)[]) {
  return getDb().prepare(sql).run(...params);
}

export function audit(actor: string, action: string, detail = "") {
  run("INSERT INTO audit (actor, action, detail) VALUES (?, ?, ?)", actor, action, detail.slice(0, 500));
}

export const newId = () => randomUUID();

/* ---------- Types des lignes ---------- */
export type UserRow = {
  id: string;
  email: string;
  name: string;
  company: string;
  role: "admin" | "client";
  password_hash: string;
  created_at: string;
  deletion_requested_at: string | null;
};
export type SiteRow = {
  id: string;
  slug: string;
  name: string;
  client_id: string | null;
  kind: "template" | "custom";
  template_id: string | null;
  content: string;
  html: string | null;
  brief: string;
  status: "brief" | "draft" | "review" | "live";
  created_at: string;
  updated_at: string;
};
export type DomainRow = {
  id: string;
  site_id: string | null;
  name: string;
  registrar: string;
  expires_at: string | null;
  auto_renew: number;
  created_at: string;
};
export type RequestRow = {
  id: string;
  site_id: string;
  client_id: string | null;
  title: string;
  body: string;
  status: "new" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
};
export type MessageRow = {
  id: string;
  request_id: string;
  author_name: string;
  author_role: string;
  body: string;
  created_at: string;
};
export type LeadRow = {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  estimate: string;
  status: "new" | "contacted" | "won" | "lost";
  consent_at: string;
  created_at: string;
};
/** Prospection à froid (commerces repérés, sans demande de leur part) : distincte des demandes de devis. */
export type ProspectRow = {
  id: string;
  category: string;
  priority: string;
  name: string;
  activity: string;
  phone: string;
  rating: string;
  finding: string;
  status: "new" | "contacted" | "won" | "lost";
  /** Cases cochées, séparées par des virgules (voir prospect-tags.ts). */
  tags: string;
  email: string;
  /** Adresse du site actuel du commerce (http ou https). */
  website: string;
  address: string;
  notes: string;
  created_at: string;
};
export type TokenRow = {
  id: string;
  name: string;
  token_hash: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};
