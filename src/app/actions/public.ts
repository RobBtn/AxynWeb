"use server";

import { randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit, get, newId, run, type UserRow } from "@/lib/db";
import { createSession, destroySession, rateLimit } from "@/lib/auth";
import { sendMail, signupAvailable } from "@/lib/mail";
import { hashPassword, sha256, verifyPassword } from "@/lib/password";

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

/* ---------- Inscription avec code envoyé par e-mail ---------- */
const SIGNUP_COOKIE = "wc_signup";
const CODE_TTL_MS = 15 * 60_000;
const RESEND_AFTER_MS = 60_000;
const MAX_CODE_ATTEMPTS = 5;

type PendingSignup = { email: string; name: string; password_hash: string; code_hash: string; expires_at: number; attempts: number; sent_at: number };

const codeHash = (email: string, code: string) => sha256(`${email}:${code}`);

async function setSignupCookie(email: string) {
  (await cookies()).set(SIGNUP_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CODE_TTL_MS / 1000,
  });
}

async function mailCode(email: string, code: string) {
  await sendMail(
    email,
    `Votre code de vérification AxynWeb : ${code}`,
    `Bonjour,\n\nVotre code de vérification AxynWeb est : ${code}\n\nIl est valable 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : aucun compte ne sera créé.\n\nAxynWeb`
  );
}

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Indiquez votre nom (2 caractères minimum).").max(80),
    email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(120),
    password: z.string().min(12, "Le mot de passe doit faire au moins 12 caractères.").max(200),
    confirm: z.string(),
    consent: z.literal("on", { error: "Votre accord est nécessaire pour créer le compte." }),
  })
  .refine((d) => d.password === d.confirm, { message: "Les deux mots de passe ne sont pas identiques.", path: ["confirm"] });

/** Étape 1 : enregistre l'inscription « en attente » et envoie le code. Aucun compte n'est créé à ce stade. */
export async function startSignup(_prev: FormState, formData: FormData): Promise<FormState> {
  // Pot de miel : un champ invisible que seuls les robots remplissent.
  if (String(formData.get("website") ?? "") !== "") return { error: "Inscription impossible." };
  if (!signupAvailable()) return { error: "Les inscriptions sont fermées pour le moment." };

  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 5, 3_600_000)) return { error: "Trop de tentatives. Réessayez dans une heure." };

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { name, email, password } = parsed.data;
  if (!rateLimit(`signup-mail:${email}`, 3, 3_600_000)) return { error: "Trop de demandes pour cette adresse. Réessayez dans une heure." };

  run("DELETE FROM signup_codes WHERE expires_at < ?", Date.now());

  try {
    if (get("SELECT 1 AS x FROM users WHERE email = ?", email)) {
      // On ne révèle pas qu'un compte existe : même parcours, mais le message prévient la personne concernée.
      await sendMail(
        email,
        "Vous avez déjà un compte AxynWeb",
        "Bonjour,\n\nQuelqu'un a tenté de créer un compte AxynWeb avec cette adresse, mais un compte existe déjà. Connectez-vous sur la page de connexion. Si vous avez oublié votre mot de passe, contactez-nous.\n\nSi ce n'était pas vous, ignorez ce message.\n\nAxynWeb"
      );
    } else {
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const now = Date.now();
      run(
        `INSERT INTO signup_codes (email, name, password_hash, code_hash, expires_at, attempts, sent_at)
              VALUES (?, ?, ?, ?, ?, 0, ?)
         ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash,
              code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, sent_at = excluded.sent_at`,
        email,
        name,
        hashPassword(password),
        codeHash(email, code),
        now + CODE_TTL_MS,
        now
      );
      await mailCode(email, code);
    }
  } catch (e) {
    console.error("[axynweb] envoi du code impossible :", e instanceof Error ? e.message : e);
    run("DELETE FROM signup_codes WHERE email = ?", email);
    return { error: "Impossible d'envoyer l'e-mail pour le moment. Réessayez plus tard." };
  }

  await setSignupCookie(email);
  redirect("/inscription/verification");
}

/** Étape 2 : le bon code crée le compte (rôle « client » uniquement) et ouvre la session. */
export async function verifySignup(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (await cookies()).get(SIGNUP_COOKIE)?.value ?? "";
  if (!email) return { error: "Votre demande a expiré. Recommencez l'inscription." };
  if (!rateLimit(`verify:${await clientIp()}`, 20, 900_000)) return { error: "Trop de tentatives. Réessayez dans 15 minutes." };

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Saisissez le code à 6 chiffres reçu par e-mail." };

  const pending = get<PendingSignup>("SELECT * FROM signup_codes WHERE email = ?", email);
  if (!pending || pending.expires_at < Date.now()) {
    run("DELETE FROM signup_codes WHERE email = ?", email);
    return { error: "Le code a expiré ou n'existe pas. Recommencez l'inscription." };
  }
  if (pending.attempts >= MAX_CODE_ATTEMPTS) {
    run("DELETE FROM signup_codes WHERE email = ?", email);
    return { error: "Trop d'essais. Recommencez l'inscription pour recevoir un nouveau code." };
  }

  const expected = Buffer.from(pending.code_hash, "hex");
  const given = Buffer.from(codeHash(email, code), "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    run("UPDATE signup_codes SET attempts = attempts + 1 WHERE email = ?", email);
    const left = MAX_CODE_ATTEMPTS - pending.attempts - 1;
    return { error: left > 0 ? `Code incorrect. Il vous reste ${left} essai${left > 1 ? "s" : ""}.` : "Code incorrect. Recommencez l'inscription." };
  }

  if (get("SELECT 1 AS x FROM users WHERE email = ?", email)) {
    run("DELETE FROM signup_codes WHERE email = ?", email);
    return { error: "Un compte existe déjà avec cet e-mail." };
  }
  const id = newId();
  run(
    "INSERT INTO users (id, email, name, company, role, password_hash) VALUES (?, ?, ?, '', 'client', ?)",
    id,
    email,
    pending.name,
    pending.password_hash
  );
  run("DELETE FROM signup_codes WHERE email = ?", email);
  (await cookies()).delete(SIGNUP_COOKIE);
  audit(email, "signup.ok");
  await createSession(id);
  redirect("/client");
}

/** Renvoie un nouveau code (60 s minimum entre deux envois). */
export async function resendSignupCode(): Promise<FormState> {
  const email = (await cookies()).get(SIGNUP_COOKIE)?.value ?? "";
  if (!email) return { error: "Votre demande a expiré. Recommencez l'inscription." };
  if (!rateLimit(`signup-mail:${email}`, 5, 3_600_000)) return { error: "Trop de demandes pour cette adresse. Réessayez dans une heure." };

  const pending = get<PendingSignup>("SELECT * FROM signup_codes WHERE email = ?", email);
  // Réponse identique si l'inscription n'existe pas (adresse déjà inscrite) : rien n'est révélé.
  if (!pending) return { ok: true, message: "Si l'adresse est valide, un nouveau code a été envoyé." };
  const wait = pending.sent_at + RESEND_AFTER_MS - Date.now();
  if (wait > 0) return { error: `Patientez ${Math.ceil(wait / 1000)} s avant de redemander un code.` };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Date.now();
  run("UPDATE signup_codes SET code_hash = ?, expires_at = ?, attempts = 0, sent_at = ? WHERE email = ?", codeHash(email, code), now + CODE_TTL_MS, now, email);
  try {
    await mailCode(email, code);
  } catch (e) {
    console.error("[axynweb] renvoi du code impossible :", e instanceof Error ? e.message : e);
    return { error: "Impossible d'envoyer l'e-mail pour le moment. Réessayez plus tard." };
  }
  return { ok: true, message: "Un nouveau code vient d'être envoyé." };
}

export async function logout() {
  await destroySession();
  redirect("/");
}
