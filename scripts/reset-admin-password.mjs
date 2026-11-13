// Applique ADMIN_EMAIL / ADMIN_PASSWORD de .env.local au compte administrateur existant.
// .env.local ne sert à créer l'admin qu'au tout premier démarrage (base vide) : changer le mot de passe
// dans ce fichier ensuite n'a aucun effet sans ce script.
// Usage, depuis la racine du projet : node scripts/reset-admin-password.mjs [data/webcrea.db]
// Le compte est créé s'il n'existe pas ; ses sessions ouvertes sont fermées. Le mot de passe n'est jamais affiché.
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";

const [dbPath = "data/webcrea.db"] = process.argv.slice(2);

// Lecture minimale de .env.local : CLE=valeur, guillemets facultatifs, lignes # ignorées.
const env = {};
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
}
const email = env.ADMIN_EMAIL?.toLowerCase();
const password = env.ADMIN_PASSWORD;
if (!email || !password) throw new Error("ADMIN_EMAIL et ADMIN_PASSWORD doivent être renseignés dans .env.local.");
if (password.length < 12) throw new Error("ADMIN_PASSWORD doit faire au moins 12 caractères.");

// Même format que src/lib/password.ts (scrypt, N=2^15, r=8, p=1, sel de 16 octets).
const N = 32768;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1, maxmem: 128 * N * 8 * 2 });
const stored = `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;

const db = new DatabaseSync(dbPath);
const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
if (user) {
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(stored, user.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  console.log(`Mot de passe mis à jour pour ${email} (sessions ouvertes fermées).`);
} else {
  db.prepare("INSERT INTO users (id, email, name, company, role, password_hash) VALUES (?, ?, ?, ?, 'admin', ?)").run(
    randomUUID(), email, "Administrateur", "AxynWeb", stored,
  );
  console.log(`Compte administrateur créé pour ${email}.`);
}
db.close();
