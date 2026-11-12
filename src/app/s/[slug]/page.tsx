import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteView, { siteMetadata } from "@/components/SiteView";
import { canViewSite } from "@/lib/access";
import { getUser } from "@/lib/auth";
import { get, type SiteRow } from "@/lib/db";
import { canonicalHostForSite } from "@/lib/domains";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const site = get<SiteRow>("SELECT * FROM sites WHERE slug = ?", slug);
  if (!site || !canViewSite(site, await getUser())) return null;
  return site;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await load((await params).slug);
  if (!site) return {};
  return siteMetadata(site, site.status === "live" ? canonicalHostForSite(site.id) : null);
}

/** Aperçu et adresse par défaut d'un site : /s/<slug>. Un site publié sur son propre domaine y reste accessible. */
export default async function ClientSite({ params }: Props) {
  const site = await load((await params).slug);
  if (!site) notFound();
  return <SiteView site={site} />;
}
