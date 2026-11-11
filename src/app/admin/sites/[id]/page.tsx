import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import ContentEditor from "@/components/ContentEditor";
import SiteProgress from "@/components/SiteProgress";
import { Card, PageTitle, StatusPill } from "@/components/Shell";
import { assignSiteAction, deleteSiteAction, reviseSiteWithAiAction, setSiteHtmlAction, setSiteStatusAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { get, type SiteRow } from "@/lib/db";
import { SITE_STATUSES, listClients, siteProgress, statusLabel } from "@/lib/data";
import { getTemplate, resolveContent } from "@/lib/templates";

export default async function AdminSite({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const site = get<SiteRow>("SELECT * FROM sites WHERE id = ?", (await params).id);
  if (!site) notFound();
  const template = getTemplate(site.template_id);
  const clients = listClients();

  return (
    <>
      <PageTitle kicker={site.kind === "template" ? `Modèle ${template?.name ?? ""}` : "Sur-mesure"} title={site.name}>
        <div className="flex items-center gap-3">
          <StatusPill status={site.status} label={statusLabel[site.status]} />
          <ActionForm action={setSiteStatusAction} submit={site.status === "live" ? "Dépublier" : "Publier"} variant={site.status === "live" ? "ghost" : "primary"} className="flex items-center gap-2">
            <input type="hidden" name="id" value={site.id} />
            <input type="hidden" name="status" value={site.status === "live" ? "draft" : "live"} />
          </ActionForm>
          <a href={`/s/${site.slug}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
            Ouvrir ↗
          </a>
          <Link href="/admin/sites" className="btn btn-ghost btn-sm">
            ← Sites
          </Link>
        </div>
      </PageTitle>

      <div className="mb-6">
        <SiteProgress steps={siteProgress(site)} />
      </div>

      {site.kind === "template" && template && (
        <Card title="Demander une retouche à l'IA" className="mb-6">
          <ActionForm action={reviseSiteWithAiAction} submit="Appliquer avec l'IA" reset className="flex flex-col gap-3">
            <input type="hidden" name="id" value={site.id} />
            <label className="field">
              Que faut-il changer ?
              <textarea className="input min-h-20" name="instruction" required minLength={5} maxLength={4000} placeholder="Ton plus chaleureux. Ajoute que nous livrons à domicile. Horaires d'été : 8 h – 20 h." />
            </label>
          </ActionForm>
        </Card>
      )}

      <details className="glass group mb-6 rounded-2xl">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold">
          Réglages : statut, client, suppression
          <span className="text-xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
        </summary>
      <div className="grid gap-6 px-6 pb-6 md:grid-cols-3">
        <Card title="Statut">
          <ActionForm action={setSiteStatusAction} submit="Appliquer" className="flex flex-col gap-3">
            <input type="hidden" name="id" value={site.id} />
            <select className="input" name="status" defaultValue={site.status} aria-label="Statut">
              {SITE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel[s]}
                </option>
              ))}
            </select>
          </ActionForm>
        </Card>
        <Card title="Client">
          <ActionForm action={assignSiteAction} submit="Attribuer" className="flex flex-col gap-3">
            <input type="hidden" name="id" value={site.id} />
            <select className="input" name="client" defaultValue={site.client_id ?? ""} aria-label="Client">
              <option value="">— Aucun —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </ActionForm>
        </Card>
        <Card title="Zone sensible">
          <p className="mb-3 text-sm text-mute">Supprime le site, ses demandes et détache ses domaines.</p>
          <ActionForm
            action={deleteSiteAction}
            submit="Supprimer le site"
            variant="danger"
            confirm={`Supprimer définitivement « ${site.name} » ?`}
          >
            <input type="hidden" name="id" value={site.id} />
          </ActionForm>
        </Card>
      </div>
      </details>

      {site.kind === "template" && template ? (
        <ContentEditor siteId={site.id} slug={site.slug} content={resolveContent(template, site.content)} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Brief">
            <p className="whitespace-pre-wrap text-bone/80">{site.brief || "—"}</p>
          </Card>
          <Card title="Page HTML">
            <ActionForm action={setSiteHtmlAction} submit="Enregistrer la page" className="flex flex-col gap-3">
              <input type="hidden" name="id" value={site.id} />
              <label className="field">
                Document HTML complet (généré par Claude via MCP, ou collé ici)
                <textarea
                  className="input min-h-72 font-mono text-xs"
                  name="html"
                  defaultValue={site.html ?? ""}
                  spellCheck={false}
                  placeholder="<!doctype html><html lang='fr'>…"
                />
              </label>
            </ActionForm>
            <p className="mt-3 text-xs text-mute">
              La page s&apos;exécute dans un bac à sable isolé. Scripts externes autorisés : jsDelivr, cdnjs, unpkg.
              Polices et images : intégrées ou en HTTPS.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
