import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Envoi d'e-mails par SMTP. Réglages dans .env.local :
 *   SMTP_HOST, SMTP_PORT (587 par défaut), SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * En développement, sans SMTP, le message s'affiche dans la console du serveur.
 * En production, sans SMTP, rien n'est envoyé : l'inscription est alors fermée
 * (voir signupAvailable) plutôt que d'accepter des comptes sans vérification.
 */
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

export const mailConfigured = Boolean(SMTP_HOST && SMTP_FROM);

let transport: Transporter | null = null;

function getTransport() {
  transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    // Port 465 : TLS direct ; sinon STARTTLS obligatoire.
    secure: Number(SMTP_PORT) === 465,
    requireTLS: Number(SMTP_PORT) !== 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transport;
}

/** Vrai si un code envoyé par e-mail peut réellement être lu par son destinataire. */
export const signupAvailable = () =>
  process.env.SIGNUP_OPEN !== "false" && (mailConfigured || process.env.NODE_ENV !== "production");

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!mailConfigured) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP non configuré");
    console.log(`\n[axynweb] E-mail (non envoyé, SMTP absent)\n  À : ${to}\n  Objet : ${subject}\n  ${text.replace(/\n/g, "\n  ")}\n`);
    return;
  }
  await getTransport().sendMail({ from: SMTP_FROM, to, subject, text });
}
