"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, get, newId, run, type RequestRow, type SiteRow, type UserRow } from "@/lib/db";
import { rateLimit, requireUser, type SessionUser } from "@/lib/auth";
import { DataError, replyToRequest, updateSiteContent } from "@/lib/data";
import { removePhoto, savePhoto } from "@/lib/media";
import { hashPassword, sha256, verifyPassword } from "@/lib/password";
import { cookies } from "next/headers";
import type { FormState } from "./public";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

async function guard(fn: () => Promise<FormState> | FormState): Promise<FormState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof DataError) return { error: e.message };
    throw e; // redirect(), notFound() et erreurs inattendues remontent.
  }
}

/** Un client n'accède qu'à ses propres sites ; l'admin à tous. */
function ownedSite(user: SessionUser, siteId: string): SiteRow {
  const site = get<SiteRow>("SELECT * FROM sites WHERE id = ?", siteId);
  if (!site || (user.role !== "admin" && site.client_id !== user.id)) throw new DataError("Site introuvable.");
  return site;
}

export async function saveContent(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  return guard(() => {
    const site = ownedSite(user, str(fd, "siteId"));
    updateSiteContent(site.id, Object.fromEntries(fd));
    audit(user.email, "site.content", site.slug);
    revalidatePath("/", "layout");
    return { ok: true, message: "Enregistré. Votre site est à jour." };
  });
}

/** Envoi ou retrait d'une photo. `file` absent = retrait. */
export async function setPhoto(fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`photo:${user.id}`, 60, 3_600_000)) return { error: "Trop d'envois en peu de temps." };
  return guard(async () => {
    const site = ownedSite(user, str(fd, "siteId"));
    const slot = str(fd, "slot");
    const file = fd.get("file");
    if (file instanceof File) await savePhoto(site, slot, file);
    else removePhoto(site, slot);
    audit(user.email, file instanceof File ? "site.photo" : "site.photo.remove", `${site.slug} ${slot}`);
    revalidatePath("/", "layout");
    return { ok: true };
  });
}

export async function createRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("client");
  if (!rateLimit(`req:${user.id}`, 20, 3_600_000)) return { error: "Trop de demandes en peu de temps." };
  const result = await guard(() => {
    const site = ownedSite(user, str(fd, "siteId"));
    const title = str(fd, "title");
    const body = str(fd, "body");
    if (title.length < 3 || title.length > 120) throw new DataError("Donnez un titre de 3 à 120 caractères.");
    if (body.length < 10 || body.length > 4000) throw new DataError("Décrivez la modification (10 caractères minimum).");
    const id = newId();
    run("INSERT INTO requests (id, site_id, client_id, title, body) VALUES (?, ?, ?, ?, ?)", id, site.id, user.id, title, body);
    audit(user.email, "request.create", title);
    return { ok: true, message: id };
  });
  if (result?.ok && result.message) redirect(`/client/demandes/${result.message}`);
  return result;
}

export async function replyRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  return guard(() => {
    const req = get<RequestRow>("SELECT * FROM requests WHERE id = ?", str(fd, "requestId"));
    if (!req) throw new DataError("Demande introuvable.");
    ownedSite(user, req.site_id);
    const body = str(fd, "body");
    const status = user.role === "admin" ? str(fd, "status") || undefined : undefined;
    if (!body && !status) throw new DataError("Écrivez un message.");
    replyToRequest(req.id, { name: user.name, role: user.role }, body, status);
    revalidatePath("/", "layout");
    return { ok: true, message: "Envoyé." };
  });
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`pwd:${user.id}`, 5, 900_000)) return { error: "Trop de tentatives. Réessayez plus tard." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 12 || next.length > 200) return { error: "Le nouveau mot de passe doit faire au moins 12 caractères." };
  const row = get<UserRow>("SELECT * FROM users WHERE id = ?", user.id);
  if (!row || !verifyPassword(current, row.password_hash)) return { error: "Mot de passe actuel incorrect." };
  run("UPDATE users SET password_hash = ? WHERE id = ?", hashPassword(next), user.id);
  // Déconnecte toutes les autres sessions.
  const token = (await cookies()).get("wc_session")?.value ?? "";
  run("DELETE FROM sessions WHERE user_id = ? AND token_hash != ?", user.id, sha256(token));
  audit(user.email, "password.change");
  return { ok: true, message: "Mot de passe modifié." };
}

/** Droit à l'effacement (RGPD art. 17) : la demande est tracée et traitée par l'administrateur. */
export async function requestDeletion(): Promise<FormState> {
  const user = await requireUser("client");
  run("UPDATE users SET deletion_requested_at = datetime('now') WHERE id = ?", user.id);
  audit(user.email, "account.deletion_requested");
  revalidatePath("/client/compte");
  return { ok: true, message: "Demande enregistrée. Nous la traitons sous 30 jours au plus." };
}
