"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, get } from "@/lib/db";
import { rateLimit, requireUser } from "@/lib/auth";
import { createFolder, deleteFolder, deleteThread, moveThreads, sendFromInbox, setThreadsStatus, syncMailbox, tagProspectMailSent } from "@/lib/inbox";
import type { FormState } from "./public";

const EMAIL = /^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]+$/;
const page = "/admin/messagerie";

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
  redirect(`${page}/conversations`);
}

export async function moveThreadAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  const id = String(fd.get("thread") ?? "");
  const folder = String(fd.get("folder") ?? "");
  if (!get("SELECT 1 FROM mail_threads WHERE id = ?", id)) return { error: "Conversation introuvable." };
  if (folder && !get("SELECT 1 FROM mail_folders WHERE id = ?", folder)) return { error: "Dossier introuvable." };
  moveThreads([id], folder || null);
  audit(user.email, "mail.move", id);
  revalidatePath(page, "layout");
  return { ok: true, message: folder ? "Conversation classée." : "Conversation retirée du dossier." };
}

export async function deleteThreadAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  const id = String(fd.get("thread") ?? "");
  const t = get<{ subject: string }>("SELECT subject FROM mail_threads WHERE id = ?", id);
  if (!t) return { error: "Conversation introuvable." };
  try {
    await deleteThread(id);
  } catch (e) {
    return { error: `Suppression impossible : ${(e instanceof Error ? e.message : "erreur inconnue").slice(0, 200)}` };
  }
  audit(user.email, "mail.delete", t.subject);
  revalidatePath(page, "layout");
  redirect(`${page}/conversations`);
}

/** Marque une conversation « traitée » ou la rouvre. */
export async function setThreadStatusAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser("admin");
  const id = String(fd.get("thread") ?? "");
  const status = fd.get("status") === "done" ? "done" : "open";
  if (!get("SELECT 1 FROM mail_threads WHERE id = ?", id)) return { error: "Conversation introuvable." };
  setThreadsStatus([id], status);
  revalidatePath(page, "layout");
  return { ok: true, message: status === "done" ? "Conversation marquée comme traitée." : "Conversation rouverte." };
}

/** Actions groupées sur les conversations cochées dans la liste. */
export async function bulkMailAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("admin");
  const ids = [...new Set(fd.getAll("id").map(String))].filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 100);
  if (ids.length === 0) return { error: "Aucune conversation sélectionnée." };
  const op = String(fd.get("op") ?? "");
  if (op === "done" || op === "open") {
    setThreadsStatus(ids, op);
    revalidatePath(page, "layout");
    return { ok: true, message: `${ids.length} conversation${ids.length > 1 ? "s" : ""} ${op === "done" ? "marquée(s) traitée(s)" : "rouverte(s)"}.` };
  }
  if (op === "move") {
    const folder = String(fd.get("folder") ?? "");
    if (folder && !get("SELECT 1 FROM mail_folders WHERE id = ?", folder)) return { error: "Dossier introuvable." };
    moveThreads(ids, folder || null);
    revalidatePath(page, "layout");
    return { ok: true, message: `${ids.length} conversation${ids.length > 1 ? "s" : ""} ${folder ? "classée(s)" : "retirée(s) de leur dossier"}.` };
  }
  if (op === "delete") {
    let n = 0;
    for (const id of ids) {
      try {
        await deleteThread(id);
        n++;
      } catch (e) {
        return { error: `Suppression interrompue après ${n} : ${(e instanceof Error ? e.message : "erreur").slice(0, 150)}` };
      }
    }
    audit(user.email, "mail.delete", `${n} conversation(s)`);
    revalidatePath(page, "layout");
    return { ok: true, message: `${n} conversation${n > 1 ? "s" : ""} supprimée${n > 1 ? "s" : ""}.` };
  }
  return { error: "Action inconnue." };
}
