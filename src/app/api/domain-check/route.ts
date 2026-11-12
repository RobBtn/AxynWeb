import { certificateAllowed } from "@/lib/domains";
import { classifyHost } from "@/lib/hosts";

/**
 * Point de contrôle de Caddy (option `on_demand_tls { ask … }`) : avant d'émettre un certificat HTTPS
 * pour un nom de domaine inconnu, Caddy demande ici si ce nom est enregistré et rattaché à un site.
 *
 * Réservé à Caddy, sur le réseau local. Deux verrous :
 *  - le nom d'hôte doit être l'adresse de bouclage (jamais le nom public du site) ;
 *  - toute visite venue d'internet passe par Caddy, qui y inscrit l'adresse réelle du visiteur dans
 *    `X-Forwarded-For` (en écrasant celle qu'un visiteur aurait fournie). Next ajoute lui-même
 *    `::ffff:127.0.0.1` aux appels locaux : seules des adresses de bouclage sont donc acceptées.
 */
const LOOPBACK = new Set(["127.0.0.1", "::1"]);

function isLocalCaller(h: Headers): boolean {
  if (h.has("x-real-ip") || h.has("forwarded")) return false;
  const forwarded = h.get("x-forwarded-for");
  if (!forwarded) return true;
  return forwarded.split(",").every((ip) => LOOPBACK.has(ip.trim().replace(/^::ffff:/i, "")));
}

export async function GET(req: Request) {
  const loopbackHost = /^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(req.headers.get("host") ?? "");
  if (!loopbackHost || !isLocalCaller(req.headers)) return new Response("Interdit", { status: 403 });

  const domain = new URL(req.url).searchParams.get("domain") ?? "";
  const parsed = classifyHost(domain);
  // Un nom de la plateforme a déjà son certificat ; seuls les domaines de clients passent par ici.
  const allowed = parsed.kind === "custom" && certificateAllowed(parsed.host);
  return new Response(allowed ? "ok" : "refusé", { status: allowed ? 200 : 404 });
}
