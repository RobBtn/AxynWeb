import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplateSite from "@/components/templates/TemplateSite";
import { canViewSite } from "@/lib/access";
import { getUser } from "@/lib/auth";
import { get, type SiteRow } from "@/lib/db";
import { getTemplate, resolveContent } from "@/lib/templates";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const site = get<SiteRow>("SELECT * FROM sites WHERE slug = ?", slug);
  if (!site || !canViewSite(site, await getUser())) return null;
  return site;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await load((await params).slug);
  if (!site) return {};
  return { title: { absolute: site.name }, robots: site.status === "live" ? undefined : { index: false } };
}

/** Site d'un client : modèle + contenu, ou page HTML sur-mesure isolée dans un cadre. */
export default async function ClientSite({ params }: Props) {
  const site = await load((await params).slug);
  if (!site) notFound();

  const template = getTemplate(site.template_id);
  if (site.kind === "template" && template) {
    return <TemplateSite template={template} content={resolveContent(template, site.content)} bare={site.status === "live"} />;
  }

  if (!site.html) {
    return (
      <main className="grid min-h-dvh place-items-center p-8 text-center">
        <div>
          <p className="kicker">Bientôt</p>
          <h1 className="display mt-4 text-6xl">{site.name}</h1>
          <p className="mt-4 text-mute">Ce site est en cours de création.</p>
        </div>
      </main>
    );
  }

  // Le HTML sur-mesure est servi par /api/raw avec un en-tête CSP « sandbox » :
  // il s'exécute dans une origine isolée, sans accès aux cookies ni à l'espace
  // client. L'isolation vient de l'en-tête (valable aussi en accès direct),
  // pas d'un attribut `sandbox` sur le cadre.
  return (
    <iframe
      src={`/api/raw/${site.slug}`}
      title={site.name}
      className="fixed inset-0 h-dvh w-full border-0 bg-white"
    />
  );
}
