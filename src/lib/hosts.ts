/**
 * Noms d'hôte : distingue la plateforme (axynweb.fr, localhost…) des domaines de clients,
 * et valide les noms de domaine saisis. Fonctions pures, utilisables dans le proxy.
 *
 * Réglage : PLATFORM_HOSTS (liste séparée par des virgules) = tous les noms qui servent
 * la plateforme elle-même. Tout autre nom reçu est traité comme le domaine d'un client.
 */
const DEFAULT_PLATFORM_HOSTS = ["axynweb.fr", "www.axynweb.fr", "localhost", "127.0.0.1"];

export function platformHosts(): string[] {
  const raw = process.env.PLATFORM_HOSTS;
  const list = raw ? raw.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean) : DEFAULT_PLATFORM_HOSTS;
  return list.length ? list : DEFAULT_PLATFORM_HOSTS;
}

/** Domaine principal de la plateforme (le premier de la liste) : ses sous-domaines peuvent héberger des sites. */
export const platformApex = () => platformHosts().find((h) => h.includes(".") && !h.startsWith("www.") && !/^\d/.test(h)) ?? "axynweb.fr";

export type HostKind = { kind: "platform" } | { kind: "custom"; host: string } | { kind: "invalid" };

/** Classe l'en-tête Host d'une requête. Pas d'en-tête (HTTP/1.0, sonde locale) : plateforme. */
export function classifyHost(rawHost: string | null | undefined): HostKind {
  if (!rawHost) return { kind: "platform" };
  let host = rawHost.trim().toLowerCase();
  if (host.startsWith("[")) return { kind: "platform" }; // littéral IPv6 : accès direct, jamais un client
  host = host.replace(/:\d{1,5}$/, "").replace(/\.$/, "");
  if (!/^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/.test(host)) return { kind: "invalid" };
  if (platformHosts().includes(host)) return { kind: "platform" };
  return { kind: "custom", host };
}

/** Sous-domaines réservés de la plateforme (messagerie, FTP…) : jamais attribués à un client. */
const RESERVED_LABELS = new Set(["www", "mail", "smtp", "imap", "pop", "pop3", "webmail", "ftp", "sftp", "ns1", "ns2", "autoconfig", "autodiscover", "admin", "api", "app", "client", "static", "cdn"]);
const BLOCKED_TLDS = new Set(["localhost", "local", "internal", "lan", "invalid", "home", "corp"]);

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

/**
 * Nettoie et valide un nom de domaine saisi (« https://www.Mon-Site.fr/ » → « mon-site.fr »).
 * Le « www. » est retiré : le site répond aussi bien sur le nom nu que sur www.
 */
export function parseDomainName(input: string): { ok: true; name: string } | { ok: false; error: string } {
  let name = input.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "");
  name = name.replace(/^www\./, "");
  if (!DOMAIN_RE.test(name)) return { ok: false, error: "Nom de domaine invalide (exemple : mon-site.fr)." };
  const tld = name.slice(name.lastIndexOf(".") + 1);
  if (BLOCKED_TLDS.has(tld)) return { ok: false, error: "Ce type de nom de domaine n'est pas autorisé." };
  if (platformHosts().includes(name) || platformHosts().includes("www." + name)) {
    return { ok: false, error: "Ce nom sert la plateforme elle-même : il ne peut pas être attribué à un site." };
  }
  const apex = platformApex();
  if (name.endsWith("." + apex)) {
    const label = name.slice(0, -(apex.length + 1));
    if (label.includes(".")) return { ok: false, error: `Un sous-domaine de ${apex} ne peut avoir qu'un seul niveau (exemple : boulangerie.${apex}).` };
    if (RESERVED_LABELS.has(label)) return { ok: false, error: `« ${label} » est réservé.` };
  }
  return { ok: true, name };
}

/** Noms sous lesquels un site rattaché à `host` peut être demandé : le nom lui-même et sa version sans « www. ». */
export const lookupNames = (host: string) => [host, host.replace(/^www\./, "")];
