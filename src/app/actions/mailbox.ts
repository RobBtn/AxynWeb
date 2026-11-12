"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, get } from "@/lib/db";
import { rateLimit, requireUser } from "@/lib/auth";
import {
  createFolder,
  deleteFolder,
  deleteMessages,
  moveMessagesToFolder,
  sendFromInbox,
  setMessagesSeen,
  syncMailbox,
  tagProspectMailSent,
} from "@/lib/inbox";
import type { FormState } from "./public";

const EMAIL = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
const page = "/admin/messagerie";
const MSG_ID = /^[0-9a-f-]{36}$/i;
const idsOf = (fd: FormData) => [...new Set(fd.getAll("id").map(String))].filter((i) => MSG_ID.test(i)).slice(0, 100);
const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? "s" : ""}`;

/** Envoie un message ou une réponse depuis la boîte mail partagée. */
export async function sendMessageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  if (!rateLimit(`mailsend:${user.id}`, 20, 3_600_000)) return { error: "Trop d'envois. Réessayez dans une heure." };
  const to = String(fd.get("to") ?? "").trim().toLowerCase();
  const subject = String(fd.get("subject") ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const text = String(fd.get("text") ?? "").trim().slice(0, 50_000);
  if (!EMAIL.test(to) || to.length > 160) return { error: "Adresse du destinataire invalide." };
  if (!subject) return { error: "Indique un objet." };
  if (!text) return { error: "Le message est vide." };
  const inReplyTo = String(fd.get("inReplyTo") ?? "").trim().slice(0, 300);
  const references = String(fd.get("references") ?? "").trim().slice(0, 2000);
  try {
    await sendFromInbox({ to, subject, text, by: user.email, inReplyTo, references });
  } catch (e) {
    return { error: `Échec de l'envoi : ${(e instanceof Error ? e.message : "erreur inconnue").slice(0, 200)}` };
  }
  audit(user.email, "mail.send", `à ${to} — ${subject}`);
  const prospect = tagProspectMailSent(to);
  revalidatePath(page, "layout");
  revalidatePath("/admin/prospects");
  return { ok: true, message: prospect ? `Message envoyé à ${to}. La fiche « ${prospect} » est cochée « Mail envoyé ».` : `Message envoyé à ${to}.` };
}

/** Récupère tout de suite les nouveaux messages. */
export async function syncAction(): Promise<FormState> {
  const user = await requireUser("admin");
  if (!rateLimit(`mailsync:${user.id}`, 20, 300_000)) return { error: "Trop d'actualisations. Patiente quelques minutes." };
  try {
    await syncMailbox(true);
  } catch (e) {
    return { error: `Impossible de lire la boîte mail : ${(e instanceof Error ? e.message : "erreur inconnue").slice(0, 200)}` };
  }
  revalidatePath(page, "layout");
  return { ok: true, message: "Boîte mail à jour." };
}

export async function createFolderAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  const name = String(fd.get("name") ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!name) return { error: "Donne un nom au dossier." };
  if (get("SELECT 1 FROM mail_folders WHERE lower(name) = lower(?)", name)) return { error: "Ce dossier existe déjà." };
  createFolder(name, user.email);
  audit(user.email, "mail.folder.create", name);
  revalidatePath(page, "layout");
  return { ok: true, message: `Dossier « ${name} » créé.` };
}

export async function deleteFolderAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  const id = String(fd.get("id") ?? "");
  const f = get<{ name: string }>("SELECT name FROM mail_folders WHERE id = ?", id);
  if (!f) return { error: "Dossier introuvable." };
  deleteFolder(id);
  audit(user.email, "mail.folder.delete", f.name);
  revalidatePath(page, "layout");
  redirect(page);
}

/** Actions sur les messages cochés ou sur le message ouvert : lu, non lu, classer, supprimer. */
export async function mailActionAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  const ids = idsOf(fd);
  if (ids.length === 0) return { error: "Aucun message sélectionné." };
  const op = String(fd.get("op") ?? "");
  const n = plural(ids.length, "message");
  const s = ids.length > 1 ? "s" : "";
  if (op === "read" || op === "unread") {
    setMessagesSeen(ids, op === "read");
    revalidatePath(page, "layout");
    return { ok: true, message: `${n} marqué${s} comme ${op === "read" ? "lu" : "non lu"}${s}.` };
  }
  if (op === "move") {
    const folder = String(fd.get("folder") ?? "");
    if (folder && !get("SELECT 1 FROM mail_folders WHERE id = ?", folder)) return { error: "Dossier introuvable." };
    moveMessagesToFolder(ids, folder || null);
    revalidatePath(page, "layout");
    return { ok: true, message: folder ? `${n} classé${s}.` : `${n} retiré${s} de leur dossier.` };
  }
  if (op === "delete") {
    try {
      await deleteMessages(ids);
    } catch (e) {
      return { error: `Suppression impossible : ${(e instanceof Error ? e.message : "erreur").slice(0, 150)}` };
    }
    audit(user.email, "mail.delete", n);
    revalidatePath(page, "layout");
    // Depuis la lecture d'un message : retour à la liste du même dossier.
    const back = String(fd.get("back") ?? "");
    if (fd.get("from") === "reading") redirect(back.startsWith(page) && !back.startsWith("//") ? back : page);
    return { ok: true, message: `${n} supprimé${s}.` };
  }
  return { error: "Action inconnue." };
}
