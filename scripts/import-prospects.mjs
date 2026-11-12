// Importe une liste de prospects (CSV « ; » : Catégorie;Priorité;Nom;Activité;Téléphone;Avis Google;Constat).
// Usage, depuis la racine du projet : node scripts/import-prospects.mjs <fichier.csv> [data/webcrea.db]
// Relançable sans risque : les lignes déjà présentes (même nom et même téléphone) sont ignorées.
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const [csvPath, dbPath = "data/webcrea.db"] = process.argv.slice(2);
if (!csvPath) throw new Error("Usage : node scripts/import-prospects.mjs <fichier.csv> [data/webcrea.db]");

// CSV séparé par « ; », champs entre guillemets (« "" » = guillemet littéral).
function parse(text) {
  const rows = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ";") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur); cur = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const text = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const [header, ...rows] = parse(text);
console.log("colonnes :", header.join(" | "));

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA busy_timeout = 5000;");
db.exec(`CREATE TABLE IF NOT EXISTS prospects (
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
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (name, phone)
);`);

const ins = db.prepare(
  "INSERT OR IGNORE INTO prospects (id, category, priority, name, activity, phone, rating, finding) VALUES (?,?,?,?,?,?,?,?)"
);
let added = 0, skipped = 0, bad = 0;
db.exec("BEGIN");
for (const r of rows) {
  if (r.length !== 7 || !r[2].trim()) { bad++; console.log("ligne ignorée :", JSON.stringify(r)); continue; }
  const [category, priority, name, activity, phone, rating, finding] = r.map((v) => v.trim());
  const res = ins.run(randomUUID(), category, priority, name, activity, phone, rating, finding);
  if (res.changes) added++; else skipped++;
}
db.exec("COMMIT");
console.log({ lignes: rows.length, ajoutés: added, doublons: skipped, invalides: bad });
console.log("total en base :", db.prepare("SELECT COUNT(*) AS n FROM prospects").get().n);
