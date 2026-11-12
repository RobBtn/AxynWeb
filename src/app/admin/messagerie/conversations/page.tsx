import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import MailBulkBar from "@/components/MailBulkBar";
import { Card, Empty, frDate } from "@/components/Shell";
import { createFolderAction, deleteFolderAction, syncAction } from "@/app/actions/mailbox";
import { emailOf, isMailView, listFolders, listThreads, mailViews, prospectsByEmail, syncMailbox, viewCounts, type MailView } from "@/lib/inbox";
import ThreadDetail from "../ThreadDetail";

export const dynamic = "force-dynamic";
const PER = 30;
const BASE = "/admin/messagerie/conversations";

type Params = { vue?: string; dossier?: string; page?: string; q?: string; c?: string };

export default async function Conversations({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const view: MailView = sp.vue && isMailView(sp.vue) ? sp.vue : "atraiter";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const open = /^[0-9a-f-]{36}$/i.test(sp.c ?? "") ? sp.c : undefined;
  const folders = listFolders();
  const folder = sp.dossier === "none" || folders.some((f) => f.id === sp.dossier) ? sp.dossier : undefined;
  const current = folders.find((f) => f.id === folder);

  let syncError = "";
  try {
    await syncMailbox();
  } catch (e) {
    syncError = e instanceof Error ? e.message : "erreur inconnue";
  }
  const counts = viewCounts();
  const { items, total, pages } = listThreads({ view, folder, query: q, page, per: PER });
  const linked = prospectsByEmail(items.map((t) => emailOf((t.last_box === "sent" ? t.last_to : t.last_from).split(",")[0])));

  const href = (o: Partial<Params>) => {
    const u = new URLSearchParams();
    const next = { vue: view, dossier: folder, q, ...o };
    if (next.vue && next.vue !== "atraiter") u.set("vue", next.vue);
    if (next.dossier) u.set("dossier", next.dossier);
    if (next.q) u.set("q", next.q);
    if (next.page && Number(next.page) > 1) u.set("page", String(next.page));
    if (next.c) u.set("c", next.c);
    const s = u.toString();
    return `${BASE}${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) => `btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`;

  return (
    <>
      {/* Vues de suivi */}
      <nav aria-label="Vues" className="mb-3 flex flex-wrap gap-2">
        {mailViews.map((v) => (
          <Link key={v.id} href={href({ vue: v.id, page: undefined, c: undefined })} aria-current={view === v.id ? "page" : undefined} className={chip(view === v.id)}>
            {v.label} · {counts[v.id]}
          </Link>
        ))}
      </nav>

      {/* Dossiers */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <span className="font-mono text-xs uppercase tracking-wider text-mute">Dossiers</span>
        <Link href={href({ dossier: "", page: undefined, c: undefined })} className={chip(!folder)}>
          Tous
        </Link>
        <Link href={href({ dossier: "none", page: undefined, c: undefined })} className={chip(folder === "none")}>
          Sans dossier
        </Link>
        {folders.map((f) => (
          <Link key={f.id} href={href({ dossier: f.id, page: undefined, c: undefined })} className={chip(folder === f.id)}>
            {f.name} · {f.n}
            {f.unread > 0 && ` (${f.unread} non lu${f.unread > 1 ? "s" : ""})`}
          </Link>
        ))}
        <details className="relative">
          <summary className="btn btn-ghost btn-sm cursor-pointer list-none">+ Dossier</summary>
          <div className="absolute left-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-ink-2 p-3 shadow-xl">
            <ActionForm action={createFolderAction} submit="Créer" reset className="flex flex-col gap-2">
              <label className="field">
                Nom du dossier
                <input className="input" name="name" maxLength={40} placeholder="Ex. Devis en cours" required />
              </label>
            </ActionForm>
          </div>
        </details>
        <ActionForm action={syncAction} submit="Actualiser" variant="ghost" className="ml-auto" />
      </div>

      {syncError && (
        <Card tone="alert" className="mb-4">
          <p className="font-semibold">La dernière actualisation a échoué.</p>
          <p className="mt-1 break-words text-sm text-mute">{syncError.slice(0, 250)} — les messages déjà récupérés restent consultables.</p>
        </Card>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Liste */}
        <section className={open ? "hidden lg:block" : ""} aria-label="Conversations">
          <form action={BASE} method="get" role="search" className="mb-3 flex gap-2">
            {view !== "atraiter" && <input type="hidden" name="vue" value={view} />}
            {folder && <input type="hidden" name="dossier" value={folder} />}
            <input className="input min-w-0 flex-1" type="search" name="q" defaultValue={q} placeholder="Rechercher…" aria-label="Rechercher" maxLength={80} />
            <button className="btn btn-primary btn-sm">OK</button>
            {q && (
              <Link href={href({ q: "", page: undefined })} className="btn btn-ghost btn-sm">
                ×
              </Link>
            )}
          </form>

          {items.length === 0 ? (
            <Empty>{q ? "Aucun résultat." : view === "atraiter" ? "Rien à traiter. 🎉" : "Aucune conversation ici."}</Empty>
          ) : (
            <>
              <MailBulkBar folders={folders.map((f) => ({ id: f.id, name: f.name }))} />
              <ul className="grid gap-1.5">
                {items.map((t) => {
                  const other = emailOf((t.last_box === "sent" ? t.last_to : t.last_from).split(",")[0]);
                  const pro = linked.get(other);
                  const selected = t.id === open;
                  return (
                    <li key={t.id} className={`flex items-start gap-2 rounded-2xl border px-3 py-2.5 ${selected ? "border-accent bg-ink-3" : "border-line bg-ink-2"}`}>
                      <input type="checkbox" name="id" value={t.id} form="mail-bulk" aria-label={`Sélectionner ${t.subject || "la conversation"}`} className="mt-1 size-4 shrink-0 cursor-pointer accent-accent" />
                      <Link href={href({ c: t.id })} className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm ${t.unread ? "font-semibold" : ""}`}>{pro ? pro.name : t.last_box === "sent" ? t.last_to : t.last_from}</span>
                          <span className="shrink-0 font-mono text-[0.68rem] text-mute">{frDate(t.last_at)}</span>
                        </span>
                        <span className={`block truncate text-sm ${t.unread ? "font-medium" : "text-mute"}`}>{t.subject || "(sans objet)"}</span>
                        <span className="block truncate text-xs text-mute">{t.last_body.replace(/\s+/g, " ")}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5 text-[0.68rem]">
                          {t.unread > 0 && <span className="pill pill-alert">{t.unread} non lu{t.unread > 1 ? "s" : ""}</span>}
                          {t.status === "done" ? (
                            <span className="pill pill-ok">Traitée</span>
                          ) : t.last_box === "sent" ? (
                            <span className="pill pill-info">En attente{t.last_by ? ` · ${t.last_by}` : ""}</span>
                          ) : (
                            <span className="pill pill-alert">À traiter</span>
                          )}
                          {t.n > 1 && <span className="pill pill-info">{t.n} messages</span>}
                          {t.folder_name && <span className="pill pill-ok">{t.folder_name}</span>}
                          {pro && <span className="pill pill-info">Prospect</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-mute">
                {total} conversation{total > 1 ? "s" : ""}
              </p>
              {pages > 1 && (
                <nav aria-label="Pages" className="mt-2 flex items-center gap-3 text-sm">
                  {page > 1 && (
                    <Link href={href({ page: String(page - 1) })} className="btn btn-ghost btn-sm">
                      ←
                    </Link>
                  )}
                  <span className="text-mute">
                    Page {page} / {pages}
                  </span>
                  {page < pages && (
                    <Link href={href({ page: String(page + 1) })} className="btn btn-ghost btn-sm">
                      →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}

          {current && (
            <div className="mt-6 border-t border-line pt-4">
              <ActionForm
                action={deleteFolderAction}
                submit="Supprimer ce dossier"
                variant="danger"
                confirm={`Supprimer le dossier « ${current.name} » ? Les conversations ne sont pas supprimées, elles reviennent dans « Sans dossier ».`}
              >
                <input type="hidden" name="id" value={current.id} />
              </ActionForm>
            </div>
          )}
        </section>

        {/* Conversation ouverte */}
        <section className={open ? "" : "hidden lg:block"} aria-label="Conversation">
          {open ? (
            <ThreadDetail id={open} backHref={href({ c: undefined })} />
          ) : (
            <Empty>Choisis une conversation dans la liste pour la lire et y répondre.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
