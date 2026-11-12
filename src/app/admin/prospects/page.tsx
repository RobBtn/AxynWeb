import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import ProspectTags from "@/components/ProspectTags";
import { Card, Empty, StatusPill, frDate, type Tone } from "@/components/Shell";
import { ChatIcon, DocIcon, ListIcon, MailCheckIcon, PhoneIcon, PinIcon, RepeatIcon } from "@/components/MailIcons";
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
import { isProspectTag, parseTags, prospectTags, type ProspectTagId } from "@/lib/prospect-tags";

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

const tagIcon = {
  rappeler: <PhoneIcon />,
  entretien: <ChatIcon />,
  presentiel: <PinIcon />,
  repasser: <RepeatIcon />,
  mail: <MailCheckIcon />,
} as const;

const entry = (active: boolean) =>
  `flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
    active ? "border-accent bg-accent font-medium text-on-accent" : "border-line bg-ink-2 hover:border-bone/40 hover:bg-ink-3"
  }`;

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ vue?: string; q?: string }> }) {
  await requireUser("admin");
  const { vue, q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim().slice(0, 80);

  const leads = all<LeadRow>("SELECT * FROM leads ORDER BY created_at DESC");
  const newLeads = leads.filter((l) => l.status === "new").length;
  // Sans choix : les demandes de devis à traiter d'abord, sinon toute la prospection.
  const view: "devis" | "tous" | ProspectTagId = vue === "devis" ? "devis" : vue && isProspectTag(vue) ? vue : vue === "tous" ? "tous" : newLeads > 0 ? "devis" : "tous";

  const prospects = all<ProspectRow>(
    "SELECT * FROM prospects ORDER BY CASE priority WHEN 'Haute' THEN 0 WHEN 'Normale' THEN 1 ELSE 2 END, rowid"
  );
  const counts = Object.fromEntries(prospectTags.map((t) => [t.id, prospects.filter((p) => parseTags(p.tags).includes(t.id)).length]));
  const needle = q.toLowerCase();
  const matches = (p: ProspectRow) =>
    !needle || [p.name, p.activity, p.phone, p.email, p.website, p.address].some((v) => v.toLowerCase().includes(needle));
  const inView = view === "devis" || view === "tous" ? prospects : prospects.filter((p) => parseTags(p.tags).includes(view));
  const shown = inView.filter(matches);
  const categories = [...new Set(shown.map((p) => p.category))].sort();

  const href = (v: string, withQ = true) => {
    const params = new URLSearchParams();
    params.set("vue", v);
    if (withQ && q) params.set("q", q);
    return `/admin/prospects?${params.toString()}`;
  };
  const title = view === "devis" ? "Demandes de devis" : view === "tous" ? "Tous les prospects" : (prospectTags.find((t) => t.id === view)?.label ?? "");

  return (
    <>
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1">
        <h1 className="display text-3xl md:text-4xl">Prospects</h1>
        <span className="font-mono text-xs text-mute">
          {leads.length} demande{leads.length > 1 ? "s" : ""} de devis · {prospects.length} commerces repérés
        </span>
      </header>

      <div className="overflow-hidden rounded-3xl border border-line bg-ink-2 shadow-sm xl:grid xl:h-[calc(100dvh-8rem)] xl:min-h-[34rem] xl:grid-cols-[16.5rem_minmax(0,1fr)]">
        {/* Volet de gauche : vues */}
        <aside aria-label="Vues" className="flex min-w-0 flex-col gap-4 border-b border-line bg-ink-3/60 p-5 xl:h-full xl:overflow-y-auto xl:border-b-0 xl:border-r">
          <nav className="flex flex-wrap gap-2 xl:flex-col">
            <Link href={href("devis", false)} className={entry(view === "devis")} aria-current={view === "devis" ? "page" : undefined}>
              <DocIcon />
              <span className="flex-1">Demandes de devis</span>
              <span className="font-mono text-xs">{newLeads > 0 ? `${newLeads}/${leads.length}` : leads.length}</span>
            </Link>
          </nav>

          <p className="border-t border-line pt-4 font-mono text-[0.68rem] uppercase tracking-wider text-mute">Prospection à froid</p>
          <nav className="flex flex-wrap gap-2 xl:flex-col xl:gap-1.5" aria-label="Vues de la prospection">
            <Link href={href("tous")} className={entry(view === "tous")} aria-current={view === "tous" ? "page" : undefined}>
              <ListIcon />
              <span className="flex-1">Tous</span>
              <span className="font-mono text-xs">{prospects.length}</span>
            </Link>
            {prospectTags.map((t) => (
              <Link key={t.id} href={href(t.id)} className={entry(view === t.id)} aria-current={view === t.id ? "page" : undefined}>
                {tagIcon[t.id]}
                <span className="flex-1">{t.label}</span>
                <span className="font-mono text-xs">{counts[t.id]}</span>
              </Link>
            ))}
          </nav>

          <p className="mt-auto text-xs leading-relaxed text-mute">
            RGPD : les fiches non modifiées depuis 3 ans (hors clients gagnés) sont supprimées automatiquement. En cas d&apos;opposition d&apos;un commerce, supprime sa fiche tout de suite.
          </p>
        </aside>

        {/* Volet de droite : contenu */}
        <section className="min-w-0 p-5 xl:h-full xl:overflow-y-auto xl:p-8" aria-label={title}>
          <h2 className="mb-1 text-xl font-semibold">{title}</h2>

          {view === "devis" ? (
            leads.length === 0 ? (
              <Empty>Aucune demande de devis pour l&apos;instant.</Empty>
            ) : (
              <>
                <p className="mb-5 text-sm text-mute">Demandes envoyées par des visiteurs ou des clients depuis le simulateur.</p>
                <div className="grid gap-4 2xl:grid-cols-2">
                  {leads.map((l) => (
                    <Card key={l.id} tone={l.status === "new" ? "alert" : "info"}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-lg font-semibold">{l.name}</p>
                          <p className="break-words text-sm text-mute">
                            <a href={`mailto:${l.email}`} className="underline">
                              {l.email}
                            </a>
                            {l.company && ` · ${l.company}`} · {frDate(l.created_at)}
                          </p>
                        </div>
                        <StatusPill status={l.status} label={statusLabel[l.status]} />
                      </div>
                      {l.estimate && <p className="mt-4 break-words rounded-xl bg-accent/10 px-4 py-2 font-mono text-xs text-accent">{l.estimate}</p>}
                      <p className="mt-4 whitespace-pre-wrap break-words text-bone/85">{l.message}</p>
                      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-4">
                        <ActionForm action={createSiteFromLeadAction} submit="Créer son site avec l'IA →" className="flex flex-col gap-2">
                          <input type="hidden" name="id" value={l.id} />
                        </ActionForm>
                        <ActionForm action={setLeadStatusAction} submit="OK" variant="ghost" className="flex items-center gap-2">
                          <input type="hidden" name="id" value={l.id} />
                          <select className="input !w-auto !py-2 text-sm" name="status" defaultValue={l.status} aria-label="Statut de la demande">
                            {(["new", "contacted", "won", "lost"] as const).map((s) => (
                              <option key={s} value={s}>
                                {statusLabel[s]}
                              </option>
                            ))}
                          </select>
                        </ActionForm>
                        <ActionForm action={deleteLeadAction} submit="Supprimer" variant="danger" confirm="Supprimer cette demande et ses données ?">
                          <input type="hidden" name="id" value={l.id} />
                        </ActionForm>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )
          ) : (
            <>
              <p className="mb-4 text-sm text-mute">
                {view === "tous"
                  ? "Commerces repérés, sans demande de leur part. Coche une case sur une fiche : elle apparaît dans la vue correspondante."
                  : "Les fiches cochées « " + title + " »."}
              </p>
              <form action="/admin/prospects" method="get" role="search" className="mb-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="vue" value={view} />
                <input className="input !w-auto min-w-56 flex-1" type="search" name="q" defaultValue={q} placeholder="Rechercher un nom, une activité, un téléphone…" aria-label="Rechercher un prospect" maxLength={80} />
                <button className="btn btn-primary btn-sm">Rechercher</button>
                {q && (
                  <Link href={href(view, false)} className="btn btn-ghost btn-sm">
                    Effacer
                  </Link>
                )}
              </form>
              {q && (
                <p className="mb-4 text-sm text-mute">
                  {shown.length} résultat{shown.length > 1 ? "s" : ""} pour « {q} »
                </p>
              )}

              {shown.length > 0 && <BulkDeleteBar />}

              {shown.length === 0 ? (
                <Empty>
                  {q
                    ? "Aucun résultat."
                    : view === "tous"
                      ? "Aucun commerce repéré pour l'instant."
                      : "Personne ici. Coche la case correspondante sur une fiche de la vue « Tous »."}
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
            </>
          )}
        </section>
      </div>
    </>
  );
}
