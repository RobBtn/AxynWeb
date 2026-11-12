import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import MailBulkBar from "@/components/MailBulkBar";
import { Empty } from "@/components/Shell";
import { frMailDate } from "@/lib/format";
import { createFolderAction, deleteFolderAction } from "@/app/actions/mailbox";
import SyncButton from "@/components/SyncButton";
import { ChartIcon, FolderIcon, FolderPlusIcon, InboxIcon, SendIcon } from "@/components/MailIcons";
import { boxCounts, emailOf, folderTree, folderWithDescendants, listMailMessages, syncMailbox } from "@/lib/inbox";
import MessageView from "./MessageView";

export const dynamic = "force-dynamic";
const PER = 40;
const BASE = "/admin/messagerie";

type Params = { dossier?: string; page?: string; q?: string; m?: string };

/** « Boulangerie <contact@x.fr> » → « Boulangerie » ; sans nom, l'adresse. */
const displayName = (a: string) => {
  const first = a.split(",")[0].trim();
  const name = first.replace(/<[^>]*>/, "").replace(/^"|"$/g, "").trim();
  return name || emailOf(first);
};

export default async function Messagerie({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const folders = folderTree();
  // « inbox » (réception, par défaut), « sent » (envoyés) ou l'identifiant d'un dossier personnalisé.
  const where = sp.dossier === "sent" ? "sent" : folders.some((f) => f.id === sp.dossier) ? (sp.dossier as string) : "inbox";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const open = /^[0-9a-f-]{36}$/i.test(sp.m ?? "") ? sp.m : undefined;
  const custom = folders.find((f) => f.id === where);

  let syncError = "";
  try {
    await syncMailbox();
  } catch (e) {
    syncError = e instanceof Error ? e.message : "erreur inconnue";
  }
  const counts = boxCounts();
  const { items, total, pages } = listMailMessages({
    box: where === "inbox" || where === "sent" ? where : undefined,
    folders: custom ? folderWithDescendants(custom.id) : undefined,
    query: q,
    page,
    per: PER,
  });

  const href = (o: Partial<Params>) => {
    const u = new URLSearchParams();
    const next = { dossier: where, q, ...o };
    if (next.dossier && next.dossier !== "inbox") u.set("dossier", next.dossier);
    if (next.q) u.set("q", next.q);
    if (next.page && Number(next.page) > 1) u.set("page", String(next.page));
    if (next.m) u.set("m", next.m);
    const s = u.toString();
    return `${BASE}${s ? `?${s}` : ""}`;
  };
  const entry = (active: boolean) =>
    `flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${active ? "border-accent bg-accent font-medium text-on-accent" : "border-line bg-ink-2 hover:border-bone/40 hover:bg-ink-3"}`;
  const title = where === "inbox" ? "Boîte de réception" : where === "sent" ? "Envoyés" : (custom?.name ?? "");

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ink-2 shadow-sm xl:grid xl:h-[calc(100dvh-8rem)] xl:min-h-[34rem] xl:grid-cols-[16.5rem_minmax(21rem,26rem)_minmax(0,1fr)]">
      {/* Dossiers */}
      <aside aria-label="Dossiers" className="flex min-w-0 flex-col gap-4 border-b border-line bg-ink-3/60 p-5 xl:h-full xl:overflow-y-auto xl:border-b-0 xl:border-r">
        <nav className="flex flex-wrap gap-2 xl:flex-col">
          <Link href={href({ dossier: "inbox", page: undefined, m: undefined })} className={entry(where === "inbox")} aria-current={where === "inbox" ? "page" : undefined}>
            <InboxIcon />
            <span className="flex-1">Boîte de réception</span>
            <span className="font-mono text-xs">{counts.unread > 0 ? `${counts.unread}/${counts.inbox}` : counts.inbox}</span>
          </Link>
          <Link href={href({ dossier: "sent", page: undefined, m: undefined })} className={entry(where === "sent")} aria-current={where === "sent" ? "page" : undefined}>
            <SendIcon />
            <span className="flex-1">Envoyés</span>
            <span className="font-mono text-xs">{counts.sent}</span>
          </Link>
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
          <span className="font-mono text-[0.68rem] uppercase tracking-wider text-mute">Dossiers</span>
          <details className="relative">
            <summary
              className="inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-line bg-ink-2 transition hover:bg-ink-3"
              title="Créer un dossier"
              aria-label="Créer un dossier"
            >
              <FolderPlusIcon />
            </summary>
            <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-line bg-ink-2 p-3 shadow-xl">
              <ActionForm action={createFolderAction} submit="Créer le dossier" reset className="flex flex-col gap-2">
                <label className="field">
                  Nom du dossier
                  <input className="input" name="name" maxLength={40} placeholder="Ex. Devis en cours" required />
                </label>
                <label className="field">
                  Placer dans
                  <select className="input" name="parent" defaultValue={custom && custom.depth + 1 < 3 ? custom.id : ""}>
                    <option value="">Racine (au premier niveau)</option>
                    {folders
                      .filter((f) => f.depth + 1 < 3)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </label>
              </ActionForm>
            </div>
          </details>
        </div>

        {folders.length === 0 ? (
          <p className="text-xs text-mute">Aucun dossier. Utilise le pictogramme ci-dessus pour en créer, puis range-y des mails ou d&apos;autres dossiers.</p>
        ) : (
          <nav className="flex flex-col gap-1.5" aria-label="Dossiers personnalisés">
            {folders.map((f) => (
              <Link
                key={f.id}
                href={href({ dossier: f.id, page: undefined, m: undefined })}
                className={entry(where === f.id)}
                style={{ marginLeft: f.depth * 14 }}
                aria-current={where === f.id ? "page" : undefined}
              >
                <FolderIcon />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <span className="font-mono text-xs">{f.totalUnread > 0 ? `${f.totalUnread}/${f.total}` : f.total}</span>
              </Link>
            ))}
          </nav>
        )}

        <Link href="/admin/messagerie/recap" className={`${entry(false)} xl:mt-auto`}>
          <ChartIcon />
          <span>Récap envois et réponses</span>
        </Link>
        {custom && (
          <ActionForm
            action={deleteFolderAction}
            submit="Supprimer ce dossier"
            variant="danger"
            confirm={`Supprimer le dossier « ${custom.name} » ? Ses sous-dossiers sont supprimés avec lui. Les messages ne sont pas supprimés : ils restent dans la réception et les envoyés.`}
          >
            <input type="hidden" name="id" value={custom.id} />
          </ActionForm>
        )}
      </aside>

      {/* Liste */}
      <section className={`min-w-0 border-b border-line xl:h-full xl:overflow-y-auto xl:border-b-0 xl:border-r ${open ? "hidden xl:block" : ""}`} aria-label={title}>
        <div className="px-5 pb-3 pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <SyncButton />
          </div>
        {syncError && (
          <p role="status" className="mb-2 break-words rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-xs">
            Actualisation impossible : {syncError.slice(0, 200)}. Les messages déjà récupérés restent consultables.
          </p>
        )}
        <form action={BASE} method="get" role="search" className="flex gap-2">
          {where !== "inbox" && <input type="hidden" name="dossier" value={where} />}
          <input className="input min-w-0 flex-1" type="search" name="q" defaultValue={q} placeholder={`Rechercher dans ${title.toLowerCase()}…`} aria-label="Rechercher" maxLength={80} />
          <button className="btn btn-primary btn-sm">OK</button>
          {q && (
            <Link href={href({ q: "", page: undefined })} className="btn btn-ghost btn-sm" aria-label="Effacer la recherche">
              ×
            </Link>
          )}
        </form>
        </div>

        {items.length === 0 ? (
          <div className="px-5 pb-5"><Empty>{q ? "Aucun message ne correspond à la recherche." : where === "sent" ? "Aucun message envoyé." : "Aucun message."}</Empty></div>
        ) : (
          <>
            <div className="sticky top-0 z-10 bg-ink-2 px-5 pb-2">
              <MailBulkBar folders={folders.map((f) => ({ id: f.id, name: f.label }))} />
            </div>
            <ul className="border-t border-line">
              {items.map((m) => {
                const unread = m.box === "inbox" && !m.seen;
                const selected = m.id === open;
                const who = m.box === "sent" ? `À : ${displayName(m.to_addr)}` : displayName(m.from_addr);
                return (
                  <li key={m.id} className={`flex items-start gap-3 border-b border-line px-5 py-4 ${selected ? "bg-ink-3" : "hover:bg-ink-3/50"}`}>
                    <input type="checkbox" name="id" value={m.id} form="mail-bulk" aria-label={`Sélectionner : ${m.subject || "message"}`} className="mt-1.5 size-4 shrink-0 cursor-pointer accent-accent" />
                    <Link href={href({ m: m.id })} className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${unread ? "font-semibold" : ""}`}>
                          {unread && <span className="mr-1.5 inline-block size-2 rounded-full bg-accent align-middle" aria-label="Non lu" />}
                          {who}
                        </span>
                        <span className="shrink-0 font-mono text-[0.68rem] text-mute">{frMailDate(m.date)}</span>
                      </span>
                      <span className={`mt-0.5 block truncate text-sm ${unread ? "font-medium" : "text-bone/85"}`}>{m.subject || "(sans objet)"}</span>
                      <span className="mt-0.5 block truncate text-xs text-mute">{m.snippet.replace(/\s+/g, " ")}</span>
                      {m.folder_name && where !== m.folder_name && <span className="pill pill-info mt-1 text-[0.65rem]">{m.folder_name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="px-5 pt-3 text-xs text-mute">
              {total} message{total > 1 ? "s" : ""}
            </p>
            {pages > 1 && (
              <nav aria-label="Pages" className="flex items-center gap-3 px-5 pb-5 pt-2 text-sm">
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
      </section>

      {/* Lecture */}
      <section className={`min-w-0 overflow-x-hidden p-6 xl:h-full xl:overflow-y-auto xl:p-10 ${open ? "" : "hidden xl:block"}`} aria-label="Lecture">
        {open ? (
          <MessageView id={open} backHref={href({ m: undefined })} hrefFor={(id) => href({ m: id })} />
        ) : (
          <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 text-center text-mute"><p className="text-lg">Aucun message sélectionné</p><p className="text-sm">Choisis un message dans la liste pour le lire et y répondre.</p></div>
        )}
      </section>
    </div>
  );
}
