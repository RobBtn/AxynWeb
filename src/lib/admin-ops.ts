import "server-only";
import { all, get, run } from "./db";
import { DataError, createClient, findSite } from "./data";
import { removeSiteMedia } from "./media";

/**
 * Opérations d'administration (comptes, sites, domaines, demandes de devis) utilisables hors de l'interface : mêmes règles que
 * les actions de l'espace admin. Utilisées par le serveur MCP.
 */
export type UserListItem = { id: string; email: string; name: string; company: string; role: "admin" | "client"; created_at: string; sites: number };

export const listUsers = () =>
  all<UserListItem>(
    `SELECT u.id, u.email, u.name, u.company, u.role, u.created_at, (SELECT COUNT(*) FROM sites s WHERE s.client_id = u.id) AS sites
       FROM users u ORDER BY CASE u.role WHEN 'admin' THEN 0 ELSE 1 END, u.created_at DESC`
  );

export function findUser(ref: string) {
  const user = get<{ id: string; email: string; name: string; role: "admin" | "client" }>(
    "SELECT id, email, name, role FROM users WHERE id = ? OR email = ?",
    ref,
    ref.toLowerCase()
  );
  if (!user) throw new DataError(`Utilisateur introuvable : ${ref}`);
  return user;
}

/** Crée un compte (client ou administrateur) avec un mot de passe provisoire, affiché une seule fois. */
export function createUser(input: { name: string; email: string; role: "admin" | "client"; company?: string }) {
  const u = createClient({ name: input.name, email: input.email, company: input.company });
  if (input.role === "admin") run("UPDATE users SET role = 'admin' WHERE id = ?", u.id);
  return { ...u, role: input.role };
}

/** Change le rôle d'un compte. Il doit toujours rester au moins un administrateur. */
export function setUserRole(ref: string, role: "admin" | "client") {
  const target = findUser(ref);
  if (target.role === role) return { id: target.id, email: target.email, role, changed: false };
  if (target.role === "admin" && (get<{ n: number }>("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")?.n ?? 0) <= 1) {
    throw new DataError("Impossible : il doit rester au moins un administrateur.");
  }
  run("UPDATE users SET role = ? WHERE id = ?", role, target.id);
  if (role === "client") run("DELETE FROM sessions WHERE user_id = ?", target.id); // les droits retirés prennent effet tout de suite
  return { id: target.id, email: target.email, role, changed: true };
}

/** Effacement RGPD d'un client : compte, sessions et demandes ; ses sites sont conservés mais détachés. */
export function deleteClient(ref: string) {
  const user = findUser(ref);
  if (user.role !== "client") throw new DataError("Seuls les comptes clients peuvent être supprimés ici (retire d'abord les droits admin).");
  run("DELETE FROM requests WHERE client_id = ?", user.id);
  run("DELETE FROM users WHERE id = ? AND role = 'client'", user.id);
  return { id: user.id, email: user.email };
}

export function assignSite(siteRef: string, clientRef: string | null) {
  const site = findSite(siteRef);
  let clientId: string | null = null;
  if (clientRef) {
    const u = findUser(clientRef);
    if (u.role !== "client") throw new DataError("Le site ne peut être rattaché qu'à un compte client.");
    clientId = u.id;
  }
  run("UPDATE sites SET client_id = ?, updated_at = datetime('now') WHERE id = ?", clientId, site.id);
  return { site: site.slug, client_id: clientId };
}

export function deleteSite(ref: string) {
  const site = findSite(ref);
  run("DELETE FROM sites WHERE id = ?", site.id);
  removeSiteMedia(site.id);
  return { id: site.id, slug: site.slug, name: site.name };
}

export function deleteDomain(ref: string) {
  const d = get<{ id: string; name: string }>("SELECT id, name FROM domains WHERE id = ? OR name = ?", ref, ref.toLowerCase());
  if (!d) throw new DataError(`Domaine introuvable : ${ref}`);
  run("DELETE FROM domains WHERE id = ?", d.id);
  return d;
}

/* ---------- Demandes de devis (leads) ---------- */
const LEAD_STATUSES = ["new", "contacted", "won", "lost"];
type LeadMini = { id: string; name: string; email: string; company: string; status: string };

export function findLead(ref: string): LeadMini {
  const exact = get<LeadMini>("SELECT id, name, email, company, status FROM leads WHERE id = ?", ref);
  if (exact) return exact;
  const byMail = all<LeadMini>("SELECT id, name, email, company, status FROM leads WHERE email = ? ORDER BY created_at DESC", ref.toLowerCase());
  if (byMail.length === 1) return byMail[0];
  if (byMail.length > 1) throw new DataError(`Plusieurs demandes pour ${ref} : utilise l'identifiant (${byMail.map((l) => l.id).join(", ")}).`);
  throw new DataError(`Demande de devis introuvable : ${ref}`);
}

export function setLeadStatus(ref: string, status: string) {
  if (!LEAD_STATUSES.includes(status)) throw new DataError(`Statut inconnu. Valeurs : ${LEAD_STATUSES.join(", ")}.`);
  const lead = findLead(ref);
  run("UPDATE leads SET status = ? WHERE id = ?", status, lead.id);
  return { ...lead, status };
}

export function deleteLead(ref: string) {
  const lead = findLead(ref);
  run("DELETE FROM leads WHERE id = ?", lead.id);
  return lead;
}

/** Transforme une demande de devis en compte client (réutilise le compte s'il existe) et la marque « contactée ». */
export function convertLead(ref: string) {
  const lead = findLead(ref);
  const existing = get<{ id: string }>("SELECT id FROM users WHERE email = ? AND role = 'client'", lead.email);
  let created: { id: string; email: string; password: string } | null = null;
  if (!existing) created = createClient({ name: lead.name, email: lead.email, company: lead.company });
  run("UPDATE leads SET status = 'contacted' WHERE id = ?", lead.id);
  return {
    lead: lead.id,
    client_id: existing?.id ?? created?.id,
    email: lead.email,
    account: existing ? "existant" : "créé",
    ...(created ? { password: created.password } : {}),
  };
}

