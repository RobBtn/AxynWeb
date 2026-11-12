import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { LOGO_CID } from "./mail-template";

/**
 * Envoi d'e-mails par SMTP. Réglages dans .env.local :
 *   SMTP_HOST, SMTP_PORT (587 par défaut), SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * En développement, sans SMTP, le message s'affiche dans la console du serveur.
 * En production, sans SMTP, rien n'est envoyé : l'inscription est alors fermée
 * (voir signupAvailable) plutôt que d'accepter des comptes sans vérification.
 */
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

// Un identifiant sans mot de passe ne peut pas se connecter : on le traite comme « non configuré ».
export const mailConfigured = Boolean(SMTP_HOST && SMTP_FROM && (!SMTP_USER || SMTP_PASS));

/** Réglages non secrets, pour l'écran « Tester l'envoi » de l'admin. */
export const mailSettings = { host: SMTP_HOST ?? "", port: Number(SMTP_PORT) || 587, from: SMTP_FROM ?? "", user: SMTP_USER ?? "" };

let transport: Transporter | null = null;

function getTransport() {
  transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    // Port 465 : TLS direct ; sinon STARTTLS obligatoire.
    secure: Number(SMTP_PORT) === 465,
    requireTLS: Number(SMTP_PORT) !== 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  return transport;
}

/** Vrai si un code envoyé par e-mail peut réellement être lu par son destinataire. */
export const signupAvailable = () =>
  process.env.SIGNUP_OPEN !== "false" && (mailConfigured || process.env.NODE_ENV !== "production");

// Logo joint aux e-mails HTML (les SVG ne s'affichent pas dans les messageries).
const LOGO_PNG = path.join(process.cwd(), "public", "logo", "axynweb-logo-1000.png");

/** Envoie un e-mail en texte brut, avec une version HTML facultative (logo joint). */
export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
  if (!mailConfigured) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP non configuré");
    console.log(`\n[axynweb] E-mail (non envoyé, SMTP absent)\n  À : ${to}\n  Objet : ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`);
    return;
  }
  await getTransport().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
    html,
    attachments: html && existsSync(LOGO_PNG) ? [{ filename: "axynweb-logo.png", path: LOGO_PNG, cid: LOGO_CID, contentDisposition: "inline" }] : [],
  });
}
