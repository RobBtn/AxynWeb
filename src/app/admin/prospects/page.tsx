import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import ProspectTags from "@/components/ProspectTags";
import { Card, Empty, StatusPill, frDate } from "@/components/Shell";
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
import ProspectMap, { type MapPoint } from "@/components/ProspectMap";
import { geocodeProspects } from "@/lib/geocode";
import { requireUser } from "@/lib/auth";
import { all, type LeadRow, type ProspectRow } from "@/lib/db";
import { statusLabel } from "@/lib/data";
import { isProspectTag, parseTags, prospectTags, type ProspectTagId } from "@/lib/prospect-tags";

type Hue = "amber" | "blue" | "green" | "coral" | "violet" | "slate";

const tagHue: Record<ProspectTagId, Hue> = { rappeler: "amber", entretien: "blue", presentiel: "green", repasser: "coral", mail: "violet" };
const statusHue: Record<string, Hue> = { new: "slate", contacted: "blue", won: "green", lost: "slate" };
const priorityHue = (p: string): Hue => (p === "Haute" ? "coral" : p === "À vérifier" ? "amber" : "slate");
const CATEGORY_HUES: Hue[] = ["coral", "amber", "blue", "violet", "green", "slate"];
/** « A. Aucun site » → une teinte stable par lettre de catégorie. */
const categoryHue = (cat: string): Hue => CATEGORY_HUES[Math.max(0, (cat.trim().toUpperCase().charCodeAt(0) || 65) - 65) % CATEGORY_HUES.length];

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-mute transition-transform group-open:rotate-180">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** Fiche repliée par défaut (nom, activité, suivi) ; le détail et les actions se déplient au clic. */
function ProspectCard({ p }: { p: ProspectRow }) {
  const tags = parseTags(p.tags);
  const hasLinks = p.phone || p.email || p.website || p.address;
  return (
    <div className="flex min-w-0 items-start gap-3">
      {/* Case de sélection : rattachée au formulaire « bulk-delete » (barre de sélection), hors du menu déroulant. */}
      <input type="checkbox" name="id" value={p.id} form="bulk-delete" aria-label={`Sélectionner ${p.name}`} className="mt-5 size-4 shrink-0 cursor-pointer accent-accent" />
      <details className={`group min-w-0 flex-1 overflow-hidden rounded-2xl border border-line border-l-4 bg-ink-2 transition hover:shadow-sm open:shadow-sm hue-${priorityHue(p.priority)}`} style={{ borderLeftColor: "var(--h)" }}>
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.name}</p>
            <p className="truncate text-sm text-mute">{[p.activity, p.city, p.rating && `${p.rating} ★`, p.phone].filter(Boolean).join(" · ") || "—"}</p>
          </div>
          <div className="hidden flex-wrap items-center justify-end gap-1.5 sm:flex">
            {tags.map((t) => (
              <span key={t} className={`chip-h hue-${tagHue[t]}`}>
                {prospectTags.find((x) => x.id === t)?.label}
              </span>
            ))}
            {/* « Nouvelle » est l'état par défaut de toute la liste : l'afficher partout ferait du bruit. */}
            {p.status !== "new" && <span className={`chip-h hue-${statusHue[p.status]}`}>{statusLabel[p.status]}</span>}
          </div>
          <Chevron />
        </summary>

        <div className="space-y-4 border-t border-line px-4 pb-4 pt-4 text-sm">
          {p.finding && <p className="break-words text-bone/85">{p.finding}</p>}

          {hasLinks && (
            <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[6rem_1fr]">
              {p.phone && (
                <>
                  <dt className="text-mute">Téléphone</dt>
                  <dd>
                    <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="underline">
                      {p.phone}
                    </a>
                  </dd>
                </>
              )}
              {p.email && (
                <>
                  <dt className="text-mute">E-mail</dt>
                  <dd className="break-all">
                    <a href={`mailto:${p.email}`} className="underline">
                      {p.email}
                    </a>
                  </dd>
                </>
              )}
              {p.website && (
                <>
                  <dt className="text-mute">Site</dt>
                  <dd className="break-all">
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="underline">
                      {p.website.replace(/^https?:\/\//, "")} ↗
                    </a>
                  </dd>
                </>
              )}
              {p.address && (
                <>
                  <dt className="text-mute">Adresse</dt>
                  <dd>{p.address}</dd>
                </>
              )}
            </dl>
          )}

          {p.notes && <p className="whitespace-pre-wrap break-words rounded-xl bg-ink-3/60 px-3 py-2">{p.notes}</p>}

          <div className="border-t border-line pt-3">
            <ProspectTags id={p.id} name={p.name} tags={p.tags} />
          </div>

          <div className="flex flex-wrap items-end gap-3">
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

          <details className="rounded-xl border border-line px-3 py-2">
            <summary className="cursor-pointer select-none font-medium">Modifier les informations</summary>
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
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                <label className="field">
                  Adresse
                  <input className="input" name="address" defaultValue={p.address} maxLength={200} autoComplete="off" placeholder="12 rue de la Paix, 35000 Rennes" />
                </label>
                <label className="field">
                  Ville
                  <input className="input" name="city" defaultValue={p.city} maxLength={80} autoComplete="off" placeholder="Déduite de l'adresse" />
                </label>
              </div>
              <label className="field">
                Notes
                <textarea className="input min-h-24" name="notes" defaultValue={p.notes} maxLength={2000} />
              </label>
            </ActionForm>
          </details>
        </div>
      </details>
    </div>
  );
}

/** Pictogramme coloré ; sur l'entrée active (fond plein) il reprend la couleur du texte. */
const tagIcon = (t: ProspectTagId, active: boolean) => {
  const icon = { rappeler: <PhoneIcon />, entretien: <ChatIcon />, presentiel: <PinIcon />, repasser: <RepeatIcon />, mail: <MailCheckIcon /> }[t];
  return <span className={active ? "" : `hue hue-${tagHue[t]}`}>{icon}</span>;
};

const entry = (active: boolean) =>
  `flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
    active ? "border-accent bg-accent font-medium text-on-accent" : "border-line bg-ink-2 hover:border-bone/40 hover:bg-ink-3"
  }`;

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ vue?: string; q?: string; ville?: string; groupe?: string }> }) {
  await requireUser("admin");
  // Adresses nouvelles ou modifiées : positionnées en arrière-plan, visibles au prochain affichage.
  void geocodeProspects();
  const { vue, q: rawQ, ville: rawCity, groupe } = await searchParams;
  const city = (rawCity ?? "").trim().slice(0, 80);
  const byCity = groupe === "ville";
  const q = (rawQ ?? "").trim().slice(0, 80);

  const leads = all<LeadRow>("SELECT * FROM leads ORDER BY created_at DESC");
  const newLeads = leads.filter((l) => l.status === "new").length;
  // Sans choix : les demandes de devis à traiter d'abord, sinon toute la prospection.
  const view: "devis" | "tous" | "carte" | ProspectTagId =
    vue === "devis" ? "devis" : vue === "carte" ? "carte" : vue && isProspectTag(vue) ? vue : vue === "tous" ? "tous" : newLeads > 0 ? "devis" : "tous";

  const prospects = all<ProspectRow>(
    "SELECT * FROM prospects ORDER BY CASE priority WHEN 'Haute' THEN 0 WHEN 'Normale' THEN 1 ELSE 2 END, rowid"
  );
  const counts = Object.fromEntries(prospectTags.map((t) => [t.id, prospects.filter((p) => parseTags(p.tags).includes(t.id)).length]));
  const needle = q.toLowerCase();
  const matches = (p: ProspectRow) =>
    !needle || [p.name, p.activity, p.phone, p.email, p.website, p.address, p.city].some((v) => v.toLowerCase().includes(needle));
  const inView = view === "devis" || view === "tous" || view === "carte" ? prospects : prospects.filter((p) => parseTags(p.tags).includes(view));
  // Ville choisie : « - » désigne les fiches sans ville.
  const inCity = (p: ProspectRow) => !city || (city === "-" ? !p.city : p.city.toLowerCase() === city.toLowerCase());
  const shown = inView.filter((p) => matches(p) && inCity(p));
  const groupOf = (p: ProspectRow) => (byCity ? p.city : p.category);
  const groups = [...new Set(shown.map(groupOf))].sort((a, b) => (!a ? 1 : !b ? -1 : a.localeCompare(b, "fr")));
  const grouped = view === "tous" || byCity;

  // Villes avec leur nombre de fiches, les plus fournies d'abord.
  const cityCounts = new Map<string, number>();
  for (const p of prospects) if (p.city) cityCounts.set(p.city, (cityCounts.get(p.city) ?? 0) + 1);
  const cities = [...cityCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"));
  const withoutCity = prospects.filter((p) => !p.city).length;
  const points: MapPoint[] = shown
    .filter((p) => p.lat !== null && p.lng !== null)
    .map((p) => ({ id: p.id, name: p.name, activity: p.activity, phone: p.phone, city: p.city, address: p.address, lat: p.lat!, lng: p.lng!, priority: p.priority }));

  const href = (v: string, withQ = true, over: { ville?: string; groupe?: string } = {}) => {
    const params = new URLSearchParams();
    params.set("vue", v);
    if (withQ && q) params.set("q", q);
    const c = over.ville ?? city;
    if (c && v !== "devis") params.set("ville", c);
    const g = over.groupe ?? (byCity ? "ville" : "");
    if (g && v !== "devis") params.set("groupe", g);
    return `/admin/prospects?${params.toString()}`;
  };
  const title = view === "devis" ? "Demandes de devis" : view === "carte" ? "Carte des prospects" : view === "tous" ? "Tous les prospects" : (prospectTags.find((t) => t.id === view)?.label ?? "");

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
              <span className={view === "devis" ? "" : "hue hue-blue"}>
                <DocIcon />
              </span>
              <span className="flex-1">Demandes de devis</span>
              <span className="font-mono text-xs">{newLeads > 0 ? `${newLeads}/${leads.length}` : leads.length}</span>
            </Link>
          </nav>

          <p className="border-t border-line pt-4 font-mono text-[0.68rem] uppercase tracking-wider text-mute">Prospection à froid</p>
          <nav className="flex flex-wrap gap-2 xl:flex-col xl:gap-1.5" aria-label="Vues de la prospection">
            <Link href={href("tous")} className={entry(view === "tous")} aria-current={view === "tous" ? "page" : undefined}>
              <span className={view === "tous" ? "" : "hue hue-slate"}>
                <ListIcon />
              </span>
              <span className="flex-1">Tous</span>
              <span className="font-mono text-xs">{prospects.length}</span>
            </Link>
            <Link href={href("carte")} className={entry(view === "carte")} aria-current={view === "carte" ? "page" : undefined}>
              <span className={view === "carte" ? "" : "hue hue-green"}>
                <PinIcon />
              </span>
              <span className="flex-1">Carte</span>
              <span className="font-mono text-xs">{prospects.filter((p) => p.lat !== null).length}</span>
            </Link>
            {prospectTags.map((t) => (
              <Link key={t.id} href={href(t.id)} className={entry(view === t.id)} aria-current={view === t.id ? "page" : undefined}>
                {tagIcon(t.id, view === t.id)}
                <span className="flex-1">{t.label}</span>
                <span className="font-mono text-xs">{counts[t.id]}</span>
              </Link>
            ))}
          </nav>

          {(cities.length > 0 || city) && view !== "devis" && (
            <>
              <p className="border-t border-line pt-4 font-mono text-[0.68rem] uppercase tracking-wider text-mute">Villes</p>
              <nav className="flex flex-wrap gap-1.5" aria-label="Filtrer par ville">
                <Link href={href(view, true, { ville: "" })} className={`chip-h ${!city ? "hue-green" : "hue-slate"}`} aria-current={!city ? "true" : undefined}>
                  Toutes
                </Link>
                {cities.map(([c, n]) => (
                  <Link key={c} href={href(view, true, { ville: c })} className={`chip-h ${city.toLowerCase() === c.toLowerCase() ? "hue-green" : "hue-slate"}`} aria-current={city.toLowerCase() === c.toLowerCase() ? "true" : undefined}>
                    {c} · {n}
                  </Link>
                ))}
                {withoutCity > 0 && (
                  <Link href={href(view, true, { ville: "-" })} className={`chip-h ${city === "-" ? "hue-green" : "hue-slate"}`} aria-current={city === "-" ? "true" : undefined}>
                    Sans ville · {withoutCity}
                  </Link>
                )}
              </nav>
            </>
          )}

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
                {view === "carte"
                  ? `${points.length} commerce${points.length > 1 ? "s" : ""} placé${points.length > 1 ? "s" : ""} sur la carte${shown.length > points.length ? ` · ${shown.length - points.length} sans adresse reconnue` : ""}. Clique sur un point pour voir la fiche.`
                  : view === "tous"
                    ? "Commerces repérés, sans demande de leur part. Coche une case sur une fiche : elle apparaît dans la vue correspondante."
                    : "Les fiches cochées « " + title + " »."}
              </p>
              {view !== "carte" && (
                <p className="mb-4 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-mute">Regrouper par</span>
                  {view === "tous" && (
                    <Link href={href(view, true, { groupe: "" })} className={`chip-h ${!byCity ? "hue-green" : "hue-slate"}`}>
                      Catégorie
                    </Link>
                  )}
                  {view !== "tous" && (
                    <Link href={href(view, true, { groupe: "" })} className={`chip-h ${!byCity ? "hue-green" : "hue-slate"}`}>
                      Aucun
                    </Link>
                  )}
                  <Link href={href(view, true, { groupe: "ville" })} className={`chip-h ${byCity ? "hue-green" : "hue-slate"}`}>
                    Ville
                  </Link>
                </p>
              )}
              <form action="/admin/prospects" method="get" role="search" className="mb-4 flex flex-wrap items-center gap-2">
                <input type="hidden" name="vue" value={view} />
                {city && <input type="hidden" name="ville" value={city} />}
                {byCity && <input type="hidden" name="groupe" value="ville" />}
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

              {view === "carte" ? (
                <ProspectMap points={points} />
              ) : (
              <>
              {shown.length > 0 && <BulkDeleteBar />}

              {shown.length === 0 ? (
                <Empty>
                  {q
                    ? "Aucun résultat."
                    : view === "tous"
                      ? "Aucun commerce repéré pour l'instant."
                      : "Personne ici. Coche la case correspondante sur une fiche de la vue « Tous »."}
                </Empty>
              ) : grouped ? (
                <div className="space-y-8">
                  {groups.map((cat) => (
                    <section key={cat}>
                      <h3 className={`mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-mute hue-${byCity ? "green" : categoryHue(cat)}`}>
                        <span className="dot-h" aria-hidden="true" />
                        {cat || (byCity ? "Sans ville" : "Sans catégorie")} · {shown.filter((p) => groupOf(p) === cat).length}
                      </h3>
                      <div className="grid gap-2.5">
                        {shown
                          .filter((p) => groupOf(p) === cat)
                          .map((p) => (
                            <ProspectCard key={p.id} p={p} />
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2.5">
                  {shown.map((p) => (
                    <ProspectCard key={p.id} p={p} />
                  ))}
                </div>
              )}
              </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
