"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, get, newId, run, type UserRow } from "@/lib/db";
import { createSession, destroySession, rateLimit } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

/** `secret` : valeur affichée une seule fois (mot de passe provisoire, jeton d'API). */
export type FormState = { ok?: boolean; error?: string; message?: string; secret?: string } | undefined;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/* ---------- Demande de devis (formulaire public) ---------- */
const leadSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  email: z.string().trim().email("Adresse e-mail invalide.").max(120),
  company: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10, "Décrivez votre projet en quelques mots.").max(3000),
  estimate: z.string().trim().max(400).optional().default(""),
  consent: z.literal("on", { error: "Votre accord est nécessaire pour traiter la demande." }),
});

export async function submitLead(_prev: FormState, formData: FormData): Promise<FormState> {
  // Pot de miel : un champ invisible que seuls les robots remplissent.
  if (String(formData.get("website") ?? "") !== "") return { ok: true, message: "Merci, votre demande est envoyée." };

  if (!rateLimit(`lead:${await clientIp()}`, 5, 3_600_000)) {
    return { error: "Trop de demandes. Réessayez dans une heure." };
  }
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const d = parsed.data;
  run(
    "INSERT INTO leads (id, name, email, company, message, estimate, consent_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    newId(),
    d.name,
    d.email.toLowerCase(),
    d.company,
    d.message,
    d.estimate
  );
  return { ok: true, message: "Merci ! Nous revenons vers vous sous 24 h ouvrées." };
}

/* ---------- Connexion / déconnexion ---------- */
const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(200),
});

// Empreinte factice : même temps de calcul que l'e-mail existe ou non.
let dummyHash: string | null = null;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Identifiants incorrects." };
  const email = parsed.data.email.toLowerCase();

  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 900_000) || !rateLimit(`login:${email}`, 5, 900_000)) {
    return { error: "Trop de tentatives. Réessayez dans 15 minutes." };
  }

  const user = get<UserRow>("SELECT * FROM users WHERE email = ?", email);
  dummyHash ??= hashPassword("webcrea-dummy-password");
  const valid = verifyPassword(parsed.data.password, user?.password_hash ?? dummyHash);
  if (!user || !valid) {
    audit(email, "login.failed", ip);
    return { error: "Identifiants incorrects." };
  }

  await createSession(user.id);
  audit(user.email, "login.ok");
  redirect(user.role === "admin" ? "/admin" : "/client");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
