import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplateSite from "@/components/templates/TemplateSite";
import { canViewSite } from "@/lib/access";
import { getUser } from "@/lib/auth";
import { get, type SiteRow } from "@/lib/db";
import { getTemplate, resolveContent, type SiteContent } from "@/lib/templates";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const site = get<SiteRow>("SELECT * FROM sites WHERE slug = ?", slug);
  if (!site || !canViewSite(site, await getUser())) return null;
  return site;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const site = await load((await params).slug);
  if (!site) return {};
  // Référencement : titre et description tirés du contenu, pour Google et les aperçus de partage.
  const template = getTemplate(site.template_id);
  const content = site.kind === "template" && template ? resolveContent(template, site.content) : null;
  const description = content?.heroSubtitle || undefined;
  return {
    title: { absolute: content ? `${content.brand} — ${content.heroTitle}` : site.name },
    description,
    openGraph: { title: content?.brand ?? site.name, description, type: "website", locale: "fr_FR" },
    robots: site.status === "live" ? undefined : { index: false },
  };
}

/** Données structurées « commerce local » : aide Google à afficher adresse, téléphone et horaires. */
function businessJsonLd(c: SiteContent): string {
  const data: Record<string, unknown> = { "@context": "https://schema.org", "@type": "LocalBusiness", name: c.brand, description: c.heroSubtitle };
  if (c.phone) data.telephone = c.phone;
  if (c.email) data.email = c.email;
  if (c.address) data.address = c.address;
  if (c.hours) data.openingHours = c.hours;
  // « < » échappé : le contenu saisi par le client ne peut pas fermer la balise.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Site d'un client : modèle + contenu, ou page HTML sur-mesure isolée dans un cadre. */
export default async function ClientSite({ params }: Props) {
  const site = await load((await params).slug);
  if (!site) notFound();

  const template = getTemplate(site.template_id);
  if (site.kind === "template" && template) {
    const content = resolveContent(template, site.content);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: businessJsonLd(content) }} />
        <TemplateSite template={template} content={content} bare={site.status === "live"} />
      </>
    );
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
