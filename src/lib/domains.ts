import "server-only";
import { Resolver } from "node:dns/promises";
import { get, type SiteRow } from "./db";
import { lookupNames } from "./hosts";

/** Site publié sur ce nom de domaine : uniquement s'il est rattaché à un site « En ligne ». */
export function siteForHost(host: string): SiteRow | null {
  const [a, b] = lookupNames(host);
  return (
    get<SiteRow>(
      `SELECT s.* FROM domains d JOIN sites s ON s.id = d.site_id
        WHERE d.name IN (?, ?) AND s.status = 'live' LIMIT 1`,
      a,
      b
    ) ?? null
  );
}

/** Domaine à utiliser comme adresse officielle d'un site (pour le référencement), s'il en a un. */
export function canonicalHostForSite(siteId: string): string | null {
  return get<{ name: string }>("SELECT name FROM domains WHERE site_id = ? ORDER BY created_at LIMIT 1", siteId)?.name ?? null;
}

/**
 * Caddy demande ici s'il peut émettre un certificat HTTPS pour ce nom (« on-demand TLS »).
 * Réponse positive seulement pour un domaine enregistré ET rattaché à un site : sans cette
 * vérification, n'importe qui pourrait faire émettre des certificats au nom du serveur.
 */
export function certificateAllowed(host: string): boolean {
  const [a, b] = lookupNames(host);
  return !!get("SELECT 1 AS x FROM domains WHERE name IN (?, ?) AND site_id IS NOT NULL", a, b);
}

/* ---------- Vérification du DNS ---------- */
export type DnsState = "ok" | "other" | "none" | "unknown";
export type DnsStatus = { state: DnsState; ips: string[] };

const cache = new Map<string, { at: number; value: DnsStatus }>();

/** Adresse IP publique du serveur, à indiquer aux clients (réglage SERVER_IP). */
export const serverIp = () => (process.env.SERVER_IP ?? "").trim();

/** Le nom de domaine pointe-t-il vers ce serveur ? Résultat gardé 60 s pour ne pas interroger le DNS à chaque affichage. */
export async function domainDns(name: string): Promise<DnsStatus> {
  const ip = serverIp();
  if (!ip) return { state: "unknown", ips: [] };
  const hit = cache.get(name);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;

  const resolver = new Resolver({ timeout: 2000, tries: 1 });
  let ips: string[] = [];
  try {
    ips = await resolver.resolve4(name);
  } catch {
    ips = [];
  }
  const value: DnsStatus = { state: ips.length === 0 ? "none" : ips.includes(ip) ? "ok" : "other", ips };
  cache.set(name, { at: Date.now(), value });
  return value;
}
