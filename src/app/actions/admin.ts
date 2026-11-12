"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, get, newId, run, type LeadRow, type RequestRow } from "@/lib/db";
import { rateLimit, requireUser } from "@/lib/auth";
import { generateSite, reviseContent } from "@/lib/ai";
import {
  DataError,
  addDomain,
  createClient,
  createSiteFromBrief,
  createSiteFromTemplate,
  findSite,
  replyToRequest,
  resetClientPassword,
  setSiteHtml,
  setSiteStatus,
  updateSiteContent,
} from "@/lib/data";
import { contentFields, getTemplate, resolveContent } from "@/lib/templates";
import { removeSiteMedia } from "@/lib/media";
import { isProspectTag, parseTags } from "@/lib/prospect-tags";
import { randomToken, sha256 } from "@/lib/password";
import type { FormState } from "./public";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Toute action admin revérifie la session et le rôle, puis rafraîchit l'espace admin. */
async function adminAction(fn: (actor: string) => FormState | Promise<FormState>): Promise<FormState> {
  const user = await requireUser("admin");
  try {
    const result = await fn(user.email);
    revalidatePath("/", "layout");
    return result;
  } catch (e) {
    if (e instanceof DataError) return { error: e.message };
    throw e;
  }
}

/* ---------- Clients ---------- */
export async function createClientAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const c = createClient({ name: str(fd, "name"), email: str(fd, "email"), company: str(fd, "company") });
    audit(actor, "client.create", c.email);
    return { ok: true, message: `Compte créé pour ${c.email}. Mot de passe provisoire (affiché une seule fois) :`, secret: c.password };
  });
}

export async function resetClientPasswordAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const c = resetClientPassword(str(fd, "id"));
    audit(actor, "client.password_reset", c.email);
    return { ok: true, message: `Nouveau mot de passe pour ${c.email} (affiché une seule fois) :`, secret: c.password };
  });
}

export async function deleteClientAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const id = str(fd, "id");
    // Effacement RGPD : le compte, ses sessions et ses demandes (avec leurs messages)
    // disparaissent ; les sites sont conservés mais détachés du client.
    run("DELETE FROM requests WHERE client_id = ?", id);
    run("DELETE FROM users WHERE id = ? AND role = 'client'", id);
    audit(actor, "client.delete", id);
    return { ok: true };
  });
}

/* ---------- Sites ---------- */
export async function createSiteAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const mode = str(fd, "mode");
    const clientMode = str(fd, "clientMode");
    let client: string | null = clientMode === "existing" ? str(fd, "client") || null : null;
    if (clientMode === "new") {
      // Compte créé sans accès communiqué : l'admin génère les identifiants plus tard.
      const created = createClient({ name: str(fd, "clientName"), email: str(fd, "clientEmail"), company: str(fd, "clientCompany") });
      audit(actor, "client.create", created.email);
      client = created.id;
    }
    const input = { name: str(fd, "name"), client };
    const site =
      mode === "brief"
        ? createSiteFromBrief({ ...input, brief: str(fd, "brief") })
        : createSiteFromTemplate({ ...input, templateId: str(fd, "templateId") });
    audit(actor, "site.create", `${site.slug} (${mode})`);
    redirect(`/admin/sites/${site.id}`);
  });
}

/* ---------- Création et retouches par l'IA ---------- */

/** Une description suffit : l'IA choisit le modèle, nomme le site et rédige tout. */
export async function createSiteWithAiAction(_p: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit("ai:create", 30, 3_600_000)) return { error: "Trop de générations en une heure. Réessayez plus tard." };
  return adminAction(async (actor) => {
    const brief = str(fd, "brief");
    const generated = await generateSite(brief);
    const site = createSiteFromTemplate({
      name: generated.name,
      templateId: generated.templateId,
      client: str(fd, "client") || null,
      content: generated.content,
    });
    run("UPDATE sites SET brief = ? WHERE id = ?", brief.slice(0, 8000), site.id);
    audit(actor, "site.create.ai", `${site.slug} (${generated.templateId})`);
    redirect(`/admin/sites/${site.id}`);
  });
}

/** Depuis une demande de devis : crée le compte client, le site, et marque le prospect comme contacté. */
export async function createSiteFromLeadAction(_p: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit("ai:create", 30, 3_600_000)) return { error: "Trop de générations en une heure. Réessayez plus tard." };
  return adminAction(async (actor) => {
    const lead = get<LeadRow>("SELECT * FROM leads WHERE id = ?", str(fd, "id"));
    if (!lead) throw new DataError("Prospect introuvable.");
    const brief = [lead.company && `Entreprise : ${lead.company}`, `Contact : ${lead.name}`, lead.message].filter(Boolean).join("\n");
    const generated = await generateSite(brief);

    const existing = get<{ id: string }>("SELECT id FROM users WHERE email = ? AND role = 'client'", lead.email);
    const clientId = existing?.id ?? createClient({ name: lead.name, email: lead.email, company: lead.company }).id;
    const site = createSiteFromTemplate({
      name: generated.name,
      templateId: generated.templateId,
      client: clientId,
      content: generated.content,
    });
    run("UPDATE sites SET brief = ? WHERE id = ?", brief.slice(0, 8000), site.id);
    run("UPDATE leads SET status = 'contacted' WHERE id = ?", lead.id);
    audit(actor, "site.create.ai", `${site.slug} depuis prospect ${lead.email}`);
    redirect(`/admin/sites/${site.id}`);
  });
}

/** Retouche libre : « ton plus chaleureux », « ajoute les horaires d'été »… */
export async function reviseSiteWithAiAction(_p: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit("ai:revise", 60, 3_600_000)) return { error: "Trop de retouches en une heure. Réessayez plus tard." };
  return adminAction(async (actor) => {
    const site = findSite(str(fd, "id"));
    const template = getTemplate(site.template_id);
    if (site.kind !== "template" || !template) throw new DataError("Les retouches par l'IA concernent les sites basés sur un modèle.");
    const patch = await reviseContent(template, resolveContent(template, site.content), str(fd, "instruction"));
    updateSiteContent(site.id, patch);
    audit(actor, "site.revise.ai", site.slug);
    return { ok: true, message: "Retouche appliquée. Rechargez l'aperçu pour la voir." };
  });
}

/** Traite une demande de modification d'un client : applique, répond, clôt. */
export async function applyRequestWithAiAction(_p: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit("ai:revise", 60, 3_600_000)) return { error: "Trop de retouches en une heure. Réessayez plus tard." };
  return adminAction(async (actor) => {
    const request = get<RequestRow>("SELECT * FROM requests WHERE id = ?", str(fd, "requestId"));
    if (!request) throw new DataError("Demande introuvable.");
    const site = findSite(request.site_id);
    const template = getTemplate(site.template_id);
    if (site.kind !== "template" || !template) throw new DataError("Ce site est sur-mesure : traitez la demande avec Claude via MCP.");
    const before = resolveContent(template, site.content);
    const patch = await reviseContent(template, before, `${request.title}\n${request.body}`);
    const changed = contentFields.filter((f) => typeof patch[f.key] === "string" && patch[f.key] !== before[f.key]);
    if (changed.length === 0) {
      throw new DataError("L'IA n'a rien pu modifier : cette demande dépasse les textes du site (photo, mise en page, nouvelle page).");
    }
    updateSiteContent(site.id, patch);
    replyToRequest(
      request.id,
      { name: "AxynWeb", role: "admin" },
      `C'est fait. Champs mis à jour : ${changed.map((f) => f.label.toLowerCase()).join(", ")}. Dites-nous si un ajustement est nécessaire.`,
      "done"
    );
    audit(actor, "request.apply.ai", `${site.slug} : ${request.title}`);
    return { ok: true, message: "Demande appliquée et clôturée." };
  });
}

export async function setSiteStatusAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const site = setSiteStatus(str(fd, "id"), str(fd, "status"));
    audit(actor, "site.status", `${site.slug} → ${str(fd, "status")}`);
    return { ok: true, message: "Statut mis à jour." };
  });
}

export async function assignSiteAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const site = findSite(str(fd, "id"));
    run("UPDATE sites SET client_id = ?, updated_at = datetime('now') WHERE id = ?", str(fd, "client") || null, site.id);
    audit(actor, "site.assign", site.slug);
    return { ok: true, message: "Client mis à jour." };
  });
}

export async function setSiteHtmlAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const site = setSiteHtml(str(fd, "id"), String(fd.get("html") ?? ""));
    audit(actor, "site.html", site.slug);
    return { ok: true, message: "Page enregistrée." };
  });
}

export async function deleteSiteAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const site = findSite(str(fd, "id"));
    run("DELETE FROM sites WHERE id = ?", site.id);
    removeSiteMedia(site.id);
    audit(actor, "site.delete", site.slug);
    redirect("/admin/sites");
  });
}

/* ---------- Domaines ---------- */
export async function addDomainAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const d = addDomain({
      name: str(fd, "name"),
      site: str(fd, "site") || null,
      registrar: str(fd, "registrar"),
      expiresAt: str(fd, "expiresAt"),
      autoRenew: fd.get("autoRenew") === "on",
    });
    audit(actor, "domain.add", d.name);
    return { ok: true, message: `${d.name} ajouté.` };
  });
}

export async function deleteDomainAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    run("DELETE FROM domains WHERE id = ?", str(fd, "id"));
    audit(actor, "domain.delete", str(fd, "id"));
    return { ok: true };
  });
}

/* ---------- Prospects ---------- */
export async function setLeadStatusAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction(() => {
    const status = str(fd, "status");
    if (!["new", "contacted", "won", "lost"].includes(status)) throw new DataError("Statut invalide.");
    run("UPDATE leads SET status = ? WHERE id = ?", status, str(fd, "id"));
    return { ok: true };
  });
}

export async function setProspectStatusAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction(() => {
    const status = str(fd, "status");
    if (!["new", "contacted", "won", "lost"].includes(status)) throw new DataError("Statut invalide.");
    run("UPDATE prospects SET status = ? WHERE id = ?", status, str(fd, "id"));
    return { ok: true };
  });
}

/** Coche ou décoche une case de suivi (« à rappeler », « entretien », …) sur un prospect. */
export async function setProspectTagAction(id: string, tag: string, on: boolean): Promise<FormState> {
  return adminAction(() => {
    if (!isProspectTag(tag)) throw new DataError("Case inconnue.");
    const row = get<{ tags: string }>("SELECT tags FROM prospects WHERE id = ?", id);
    if (!row) throw new DataError("Prospect introuvable.");
    const next = new Set(parseTags(row.tags));
    if (on) next.add(tag);
    else next.delete(tag);
    run("UPDATE prospects SET tags = ? WHERE id = ?", [...next].join(","), id);
    return { ok: true };
  });
}

export async function deleteProspectAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    run("DELETE FROM prospects WHERE id = ?", str(fd, "id"));
    audit(actor, "prospect.delete", str(fd, "id"));
    return { ok: true };
  });
}

export async function deleteLeadAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    run("DELETE FROM leads WHERE id = ?", str(fd, "id"));
    audit(actor, "lead.delete", str(fd, "id"));
    return { ok: true };
  });
}

/* ---------- Jetons MCP ---------- */
export async function createTokenAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    const name = str(fd, "name") || "Claude";
    const token = `wc_${randomToken(32)}`;
    run("INSERT INTO api_tokens (id, name, token_hash) VALUES (?, ?, ?)", newId(), name.slice(0, 60), sha256(token));
    audit(actor, "token.create", name);
    return { ok: true, message: "Jeton créé. Copiez-le maintenant, il ne sera plus jamais affiché :", secret: token };
  });
}

export async function revokeTokenAction(_p: FormState, fd: FormData): Promise<FormState> {
  return adminAction((actor) => {
    run("UPDATE api_tokens SET revoked_at = datetime('now') WHERE id = ?", str(fd, "id"));
    audit(actor, "token.revoke", str(fd, "id"));
    return { ok: true };
  });
}
