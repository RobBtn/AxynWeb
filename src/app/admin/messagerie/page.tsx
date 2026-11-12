import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import MailBulkBar from "@/components/MailBulkBar";
import { Empty } from "@/components/Shell";
import { frMailDate } from "@/lib/format";
import { createFolderAction, deleteFolderAction, syncAction } from "@/app/actions/mailbox";
import { boxCounts, emailOf, listFolders, listMailMessages, syncMailbox } from "@/lib/inbox";
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
  const folders = listFolders();
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
    folder: custom?.id,
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
    `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${active ? "bg-accent text-on-accent font-medium" : "hover:bg-ink-3"}`;
  const title = where === "inbox" ? "Boîte de réception" : where === "sent" ? "Envoyés" : (custom?.name ?? "");

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[12.5rem_minmax(0,23rem)_minmax(0,1fr)]">
      {/* Dossiers */}
      <aside aria-label="Dossiers" className="flex flex-col gap-3 xl:sticky xl:top-6">
        <nav className="flex flex-wrap gap-1 xl:flex-col">
          <Link href={href({ dossier: "inbox", page: undefined, m: undefined })} className={entry(where === "inbox")} aria-current={where === "inbox" ? "page" : undefined}>
            <span>Boîte de réception</span>
            <span className="font-mono text-xs">{counts.unread > 0 ? `${counts.unread}/${counts.inbox}` : counts.inbox}</span>
          </Link>
          <Link href={href({ dossier: "sent", page: undefined, m: undefined })} className={entry(where === "sent")} aria-current={where === "sent" ? "page" : undefined}>
            <span>Envoyés</span>
            <span className="font-mono text-xs">{counts.sent}</span>
          </Link>
          {folders.length > 0 && <p className="mt-2 hidden px-3 font-mono text-[0.68rem] uppercase tracking-wider text-mute xl:block">Dossiers</p>}
          {folders.map((f) => (
            <Link key={f.id} href={href({ dossier: f.id, page: undefined, m: undefined })} className={entry(where === f.id)} aria-current={where === f.id ? "page" : undefined}>
              <span className="truncate">{f.name}</span>
              <span className="font-mono text-xs">{f.unread > 0 ? `${f.unread}/${f.n}` : f.n}</span>
            </Link>
          ))}
          <Link href="/admin/messagerie/recap" className={`${entry(false)} xl:mt-3`}>
            Récap envois et réponses
          </Link>
        </nav>
        <details>
          <summary className="btn btn-ghost btn-sm cursor-pointer list-none">+ Nouveau dossier</summary>
          <div className="mt-2 rounded-2xl border border-line bg-ink-2 p-3">
            <ActionForm action={createFolderAction} submit="Créer" reset className="flex flex-col gap-2">
              <label className="field">
                Nom du dossier
                <input className="input" name="name" maxLength={40} placeholder="Ex. Devis en cours" required />
              </label>
            </ActionForm>
          </div>
        </details>
        <ActionForm action={syncAction} submit="Actualiser" variant="ghost" />
        {custom && (
          <ActionForm
            action={deleteFolderAction}
            submit="Supprimer ce dossier"
            variant="danger"
            confirm={`Supprimer le dossier « ${custom.name} » ? Les messages ne sont pas supprimés, ils restent dans la réception et les envoyés.`}
          >
            <input type="hidden" name="id" value={custom.id} />
          </ActionForm>
        )}
      </aside>

      {/* Liste */}
      <section className={open ? "hidden xl:block" : ""} aria-label={title}>
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        {syncError && (
          <p role="status" className="mb-2 break-words rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-xs">
            Actualisation impossible : {syncError.slice(0, 200)}. Les messages déjà récupérés restent consultables.
          </p>
        )}
        <form action={BASE} method="get" role="search" className="mb-2 flex gap-2">
          {where !== "inbox" && <input type="hidden" name="dossier" value={where} />}
          <input className="input min-w-0 flex-1" type="search" name="q" defaultValue={q} placeholder={`Rechercher dans ${title.toLowerCase()}…`} aria-label="Rechercher" maxLength={80} />
          <button className="btn btn-primary btn-sm">OK</button>
          {q && (
            <Link href={href({ q: "", page: undefined })} className="btn btn-ghost btn-sm" aria-label="Effacer la recherche">
              ×
            </Link>
          )}
        </form>

        {items.length === 0 ? (
          <Empty>{q ? "Aucun message ne correspond à la recherche." : where === "sent" ? "Aucun message envoyé." : "Aucun message."}</Empty>
        ) : (
          <>
            <MailBulkBar folders={folders.map((f) => ({ id: f.id, name: f.name }))} />
            <ul className="overflow-hidden rounded-xl border border-line">
              {items.map((m) => {
                const unread = m.box === "inbox" && !m.seen;
                const selected = m.id === open;
                const who = m.box === "sent" ? `À : ${displayName(m.to_addr)}` : displayName(m.from_addr);
                return (
                  <li key={m.id} className={`flex items-start gap-2 border-b border-line px-2.5 py-2 last:border-b-0 ${selected ? "bg-ink-3" : "bg-ink-2"}`}>
                    <input type="checkbox" name="id" value={m.id} form="mail-bulk" aria-label={`Sélectionner : ${m.subject || "message"}`} className="mt-1 size-4 shrink-0 cursor-pointer accent-accent" />
                    <Link href={href({ m: m.id })} className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${unread ? "font-semibold" : ""}`}>
                          {unread && <span className="mr-1.5 inline-block size-2 rounded-full bg-accent align-middle" aria-label="Non lu" />}
                          {who}
                        </span>
                        <span className="shrink-0 font-mono text-[0.68rem] text-mute">{frMailDate(m.date)}</span>
                      </span>
                      <span className={`block truncate text-sm ${unread ? "font-medium" : "text-bone/85"}`}>{m.subject || "(sans objet)"}</span>
                      <span className="block truncate text-xs text-mute">{m.snippet.replace(/\s+/g, " ")}</span>
                      {m.folder_name && where !== m.folder_name && <span className="pill pill-info mt-1 text-[0.65rem]">{m.folder_name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-mute">
              {total} message{total > 1 ? "s" : ""}
            </p>
            {pages > 1 && (
              <nav aria-label="Pages" className="mt-1 flex items-center gap-3 text-sm">
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
      <section className={open ? "" : "hidden xl:block"} aria-label="Lecture">
        {open ? (
          <MessageView id={open} backHref={href({ m: undefined })} hrefFor={(id) => href({ m: id })} />
        ) : (
          <Empty>Sélectionne un message dans la liste pour le lire.</Empty>
        )}
      </section>
    </div>
  );
}
