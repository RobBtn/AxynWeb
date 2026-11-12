import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import SiteView, { siteMetadata } from "@/components/SiteView";
import { siteForHost } from "@/lib/domains";
import { classifyHost } from "@/lib/hosts";

type Props = { params: Promise<{ host: string }> };

/**
 * Site servi sur le nom de domaine d'un client. Cette route n'est jamais appelée directement :
 * le proxy y réécrit les visites dont le nom d'hôte n'est pas celui de la plateforme.
 * Visiteurs anonymes uniquement : seul un site « En ligne » est affiché.
 */
async function load(rawHost: string) {
  const parsed = classifyHost(decodeURIComponent(rawHost));
  if (parsed.kind !== "custom") return null;
  // Défense en profondeur : le domaine de l'URL doit être celui de la visite d'origine, que seul le proxy inscrit
  // dans cet en-tête (jamais le site d'un autre domaine). En production Next remplace l'en-tête Host lors de la réécriture.
  const origin = (await headers()).get("x-axynweb-host");
  if (origin !== parsed.host) return null;
  return { host: parsed.host, site: siteForHost(parsed.host) };
}

// Pas d'icône AxynWeb sur le site d'un client (ses propres icônes viendront d'un réglage du site).
const NO_PLATFORM_ICONS: Metadata["icons"] = { icon: [], shortcut: [], apple: [] };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load((await params).host);
  if (!found?.site) return { robots: { index: false }, icons: NO_PLATFORM_ICONS };
  return { ...siteMetadata(found.site, found.host.replace(/^www\./, "")), icons: NO_PLATFORM_ICONS };
}

export default async function DomainSite({ params }: Props) {
  const found = await load((await params).host);
  if (!found?.site) notFound();
  return <SiteView site={found.site} />;
}
