import { getUser } from "@/lib/auth";
import { get } from "@/lib/db";

/**
 * Affiche le HTML d'un e-mail (déjà nettoyé à l'enregistrement) dans un cadre isolé.
 * Cette réponse porte sa propre politique de sécurité : aucun script, aucune connexion, aucune police ni feuille de style
 * externe. Les images distantes (souvent des pixels espions) ne sont chargées que sur demande (?img=1).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user || user.role !== "admin") return new Response("Non autorisé", { status: 401 });
  const { id } = await params;
  const row = get<{ html: string }>("SELECT html FROM mail_messages WHERE id = ?", id);
  if (!row || !row.html) return new Response("Introuvable", { status: 404 });

  const remote = new URL(request.url).searchParams.get("img") === "1";
  const csp = [
    "default-src 'none'",
    `img-src data:${remote ? " https: http:" : ""}`,
    "style-src 'unsafe-inline'",
    "font-src data:",
    "base-uri 'none'",
    "form-action 'none'",
    "sandbox allow-same-origin allow-popups allow-popups-to-escape-sandbox",
  ].join("; ");

  const page = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><style>html,body{margin:0;background:#fff;color:#111}body{padding:14px;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}a{color:#1a56db}</style></head><body>${row.html}</body></html>`;
  return new Response(page, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": csp,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    },
  });
}
