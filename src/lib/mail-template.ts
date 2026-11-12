import "server-only";
import { brand } from "./config";

/** Identifiant de l'image jointe : le gabarit la référence en « cid: », mail.ts la joint au message. */
export const LOGO_CID = "axynweb-logo";

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Mêmes couleurs que le site (crème, vert sapin, encre).
const C = { bg: "#f3f0e6", card: "#fffdf6", ink: "#12150d", mute: "#666553", accent: "#164a36", tint: "#e2eed9" };
const FONT = "Arial, Helvetica, sans-serif";

/** Paragraphe de texte courant. Le texte est échappé : jamais de HTML venant d'un utilisateur. */
export const mailParagraph = (text: string) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${C.ink};">${escapeHtml(text)}</p>`;

/** Grand code à recopier (code de vérification). */
export const mailCodeBox = (code: string) =>
  `<p style="margin:8px 0 20px;padding:18px 12px;text-align:center;background:${C.tint};border:1px solid ${C.accent};border-radius:12px;` +
  `font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${C.accent};">${escapeHtml(code)}</p>`;

export const mailNote = (text: string) =>
  `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:${C.mute};">${escapeHtml(text)}</p>`;

/**
 * Habillage commun des e-mails : logo, carte, pied de page. Mise en page en tableaux et styles en ligne,
 * seule façon de rester lisible dans Gmail, Outlook et les messageries mobiles.
 */
export function mailLayout({ title, preheader, body }: { title: string; preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
      <tr><td style="padding:0 0 20px 4px;">
        <img src="cid:${LOGO_CID}" width="176" alt="${escapeHtml(brand.name)}" style="display:block;border:0;outline:none;height:auto;width:176px;">
      </td></tr>
      <tr><td style="background:${C.card};border:1px solid ${C.ink};border-radius:16px;padding:32px;font-family:${FONT};color:${C.ink};">
        <h1 style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:1.25;color:${C.ink};">${escapeHtml(title)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:20px 4px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${C.mute};">
        Message envoyé automatiquement par ${escapeHtml(brand.name)}. Merci de ne pas y répondre.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
