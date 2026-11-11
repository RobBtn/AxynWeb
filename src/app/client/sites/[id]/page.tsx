import Link from "next/link";
import { notFound } from "next/navigation";
import ContentEditor from "@/components/ContentEditor";
import { Card, PageTitle, StatusPill } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { get, type SiteRow } from "@/lib/db";
import { statusLabel } from "@/lib/data";
import { getTemplate, resolveContent } from "@/lib/templates";

export default async function ClientSiteEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("client");
  const site = get<SiteRow>("SELECT * FROM sites WHERE id = ? AND client_id = ?", (await params).id, user.id);
  if (!site) notFound();
  const template = getTemplate(site.template_id);

  return (
    <>
      <PageTitle kicker="Mon site" title={site.name}>
        <StatusPill status={site.status} label={statusLabel[site.status]} />
      </PageTitle>
      {site.kind === "template" && template ? (
        <ContentEditor siteId={site.id} slug={site.slug} content={resolveContent(template, site.content)} />
      ) : (
        <Card title="Site sur-mesure">
          <p className="text-bone/75">
            Ce site a été créé sur-mesure. Pour le faire évoluer, décrivez simplement ce que vous souhaitez : nous nous
            en occupons.
          </p>
          <div className="mt-5 flex gap-3">
            <Link href="/client/demandes" className="btn btn-primary btn-sm">
              Demander une modification
            </Link>
            <a href={`/s/${site.slug}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
              Voir le site ↗
            </a>
          </div>
        </Card>
      )}
    </>
  );
}
