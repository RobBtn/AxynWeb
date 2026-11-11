import { canViewSite } from "@/lib/access";
import { getUser } from "@/lib/auth";
import { get, type SiteRow } from "@/lib/db";

/**
 * Sert le HTML d'un site sur-mesure. La directive CSP `sandbox` force une
 * origine opaque : même ouvert directement, ce document ne peut ni lire les
 * cookies de la plateforme ni appeler ses API. Les scripts externes sont
 * limités à trois CDN ; aucune police ni requête réseau tierce n'est permise.
 */
const RAW_CSP = [
  "sandbox allow-scripts allow-popups allow-forms",
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com",
  "style-src 'unsafe-inline'",
  "img-src data: blob: https:",
  "font-src data:",
  "media-src data: blob: https:",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = get<SiteRow>("SELECT * FROM sites WHERE slug = ?", slug);
  if (!site || site.kind !== "custom" || !site.html || !canViewSite(site, await getUser())) {
    return new Response("Introuvable", { status: 404 });
  }
  return new Response(site.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": RAW_CSP,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": site.status === "live" ? "all" : "noindex",
    },
  });
}
