import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import ProspectTags from "@/components/ProspectTags";
import { Card, Empty, PageTitle, StatusPill, frDate, type Tone } from "@/components/Shell";
import {
  createSiteFromLeadAction,
  deleteLeadAction,
  deleteProspectAction,
  setLeadStatusAction,
  setProspectStatusAction,
  updateProspectInfoAction,
} from "@/app/actions/admin";
import BulkDeleteBar from "@/components/BulkDeleteBar";
import { requireUser } from "@/lib/auth";
import { all, type LeadRow, type ProspectRow } from "@/lib/db";
import { statusLabel } from "@/lib/data";
import { isProspectTag, parseTags, prospectTags } from "@/lib/prospect-tags";

/** Teinte d'une fiche selon son suivi : à faire (jaune), entretien (bleu), déjà vu (vert) ; rien de coché = neutre. */
function prospectTone(tags: string[]): Tone | undefined {
  if (tags.includes("rappeler") || tags.includes("repasser")) return "alert";
  if (tags.includes("entretien")) return "info";
  if (tags.includes("presentiel")) return "ok";
  return undefined;
}

function ProspectCard({ p }: { p: ProspectRow }) {
  const tags = parseTags(p.tags);
  return (
    <Card tone={prospectTone(tags)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {/* Case de sélection : rattachée au formulaire « bulk-delete » (barre de sélection) même si elle est ici. */}
          <input type="checkbox" name="id" value={p.id} form="bulk-delete" aria-label={`Sélectionner ${p.name}`} className="mt-1.5 size-4 shrink-0 cursor-pointer accent-accent" />
          <div className="min-w-0">
            <p className="font-semibold">
              {p.name}
              {p.priority && <span className="ml-2 font-mono text-xs font-normal text-mute">{p.priority}</span>}
            </p>
            <p className="text-sm text-mute">
              {[p.activity, p.rating && `${p.rating} ★`].filter(Boolean).join(" · ")}
              {p.phone && (
                <>
                  {(p.activity || p.rating) && " · "}
                  <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="underline">
                    {p.phone}
                  </a>
                </>
              )}
            </p>
            {(p.email || p.website || p.address) && (
              <p className="mt-1 break-words text-sm text-mute">
                {p.email && (
                  <a href={`mailto:${p.email}`} className="underline">
                    {p.email}
                  </a>
                )}
                {p.website && (
                  <>
                    {p.email && " · "}
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="underline">
                      {p.website.replace(/^https?:\/\//, "")} ↗
                    </a>
                  </>
                )}
                {p.address && (
                  <>
                    {(p.email || p.website) && " · "}
                    {p.address}
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <span key={t} className="pill pill-info">
              {prospectTags.find((x) => x.id === t)?.label}
            </span>
          ))}
          {/* « Nouvelle » est l'état par défaut de toute la liste : l'afficher partout ferait du bruit. */}
          {p.status !== "new" && <StatusPill status={p.status} label={statusLabel[p.status]} />}
        </div>
      </div>
      {p.finding && <p className="mt-3 break-words text-sm text-bone/85">{p.finding}</p>}
      {p.notes && <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-bone/5 px-3 py-2 text-sm">{p.notes}</p>}
      <div className="mt-4 border-t border-line pt-3">
        <ProspectTags id={p.id} name={p.name} tags={p.tags} />
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer select-none font-medium underline-offset-4 hover:underline">Informations (e-mail, site, adresse, notes)</summary>
        <ActionForm action={updateProspectInfoAction} submit="Enregistrer" className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={p.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              E-mail
              <input className="input" type="email" name="email" defaultValue={p.email} maxLength={120} autoComplete="off" placeholder="contact@commerce.fr" />
            </label>
            <label className="field">
              Site actuel
              <input className="input" name="website" defaultValue={p.website} maxLength={200} autoComplete="off" placeholder="commerce.fr" />
            </label>
          </div>
          <label className="field">
            Adresse
            <input className="input" name="address" defaultValue={p.address} maxLength={200} autoComplete="off" />
          </label>
          <label className="field">
            Notes
            <textarea className="input min-h-24" name="notes" defaultValue={p.notes} maxLength={2000} />
          </label>
        </ActionForm>
      </details>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <ActionForm action={setProspectStatusAction} submit="OK" variant="ghost" className="flex items-center gap-2">
          <input type="hidden" name="id" value={p.id} />
          <select className="input !w-auto !py-2 text-sm" name="status" defaultValue={p.status} aria-label={`Statut de ${p.name}`}>
            {(["new", "contacted", "won", "lost"] as const).map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </ActionForm>
        <ActionForm action={deleteProspectAction} submit="Supprimer" variant="danger" confirm={`Supprimer ${p.name} de la liste ?`}>
          <input type="hidden" name="id" value={p.id} />
        </ActionForm>
      </div>
    </Card>
  );
}

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  await requireUser("admin");
  const { vue } = await searchParams;
  const view = vue && isProspectTag(vue) ? vue : "tous";

  const leads = all<LeadRow>("SELECT * FROM leads ORDER BY created_at DESC");
  const prospects = all<ProspectRow>(
    "SELECT * FROM prospects ORDER BY CASE priority WHEN 'Haute' THEN 0 WHEN 'Normale' THEN 1 ELSE 2 END, rowid"
  );
  const counts = Object.fromEntries(prospectTags.map((t) => [t.id, prospects.filter((p) => parseTags(p.tags).includes(t.id)).length]));
  const shown = view === "tous" ? prospects : prospects.filter((p) => parseTags(p.tags).includes(view));
  const categories = [...new Set(shown.map((p) => p.category))].sort();

  const tabs = [{ id: "tous", label: "Tous", n: prospects.length }, ...prospectTags.map((t) => ({ id: t.id, label: t.label, n: counts[t.id] }))];

  return (
    <>
      <PageTitle kicker="Administration" title="Prospects" />
      {leads.length === 0 ? (
        <Empty>Aucune demande de devis pour l&apos;instant.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {leads.map((l) => (
            <Card key={l.id} tone={l.status === "new" ? "alert" : "info"}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2">
                    <span className="pill pill-info">Demande de devis</span>
                  </p>
                  <p className="text-lg font-semibold">{l.name}</p>
                  <p className="text-sm text-mute">
                    <a href={`mailto:${l.email}`} className="underline">
                      {l.email}
                    </a>
                    {l.company && ` · ${l.company}`} · {frDate(l.created_at)}
                  </p>
                </div>
                <StatusPill status={l.status} label={statusLabel[l.status]} />
              </div>
              {l.estimate && <p className="mt-4 rounded-xl bg-accent/10 px-4 py-2 font-mono text-xs text-accent">{l.estimate}</p>}
              <p className="mt-4 whitespace-pre-wrap text-bone/85">{l.message}</p>
              <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                <ActionForm action={createSiteFromLeadAction} submit="Créer son site avec l'IA →" className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={l.id} />
                </ActionForm>
                <ActionForm action={setLeadStatusAction} submit="OK" variant="ghost" className="flex items-center gap-2">
                  <input type="hidden" name="id" value={l.id} />
                  <select className="input !w-auto !py-2 text-sm" name="status" defaultValue={l.status} aria-label="Statut du prospect">
                    {(["new", "contacted", "won", "lost"] as const).map((s) => (
                      <option key={s} value={s}>
                        {statusLabel[s]}
                      </option>
                    ))}
                  </select>
                </ActionForm>
                <ActionForm action={deleteLeadAction} submit="Supprimer" variant="danger" confirm="Supprimer ce prospect et ses données ?">
                  <input type="hidden" name="id" value={l.id} />
                </ActionForm>
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 id="prospection" className="mb-1 mt-12 scroll-mt-6 text-2xl font-semibold">
        Prospection à froid
      </h2>
      <p className="mb-5 text-sm text-mute">
        {prospects.length} commerces repérés, sans demande de leur part. Coche une case sur une fiche : elle apparaît dans l&apos;onglet correspondant.
      </p>

      <nav aria-label="Vues de la prospection" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "tous" ? "/admin/prospects#prospection" : `/admin/prospects?vue=${t.id}#prospection`}
            aria-current={view === t.id ? "page" : undefined}
            className={`btn btn-sm ${view === t.id ? "btn-primary" : "btn-ghost"}`}
          >
            {t.label} · {t.n}
          </Link>
        ))}
      </nav>

      {shown.length > 0 && <BulkDeleteBar />}

      {shown.length === 0 ? (
        <Empty>
          {view === "tous"
            ? "Aucun commerce repéré pour l'instant."
            : "Personne dans cet onglet. Coche la case correspondante sur une fiche de l'onglet « Tous »."}
        </Empty>
      ) : view === "tous" ? (
        <div className="space-y-8">
          {categories.map((cat) => (
            <section key={cat}>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-mute">
                {cat || "Sans catégorie"} · {shown.filter((p) => p.category === cat).length}
              </h3>
              <div className="grid gap-3">
                {shown
                  .filter((p) => p.category === cat)
                  .map((p) => (
                    <ProspectCard key={p.id} p={p} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {shown.map((p) => (
            <ProspectCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-mute">
        RGPD : les prospects sans suite doivent être supprimés au plus tard 3 ans après le dernier contact.
      </p>
    </>
  );
}
