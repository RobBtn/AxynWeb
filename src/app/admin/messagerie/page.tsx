import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import { Card, Empty, frDate } from "@/components/Shell";
import { deleteFolderAction } from "@/app/actions/mailbox";
import { listFolders, listThreads, syncMailbox } from "@/lib/inbox";

export const dynamic = "force-dynamic";
const PER = 30;

export default async function Messagerie({ searchParams }: { searchParams: Promise<{ dossier?: string; page?: string; q?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const folders = listFolders();
  const folder = sp.dossier === "none" || folders.some((f) => f.id === sp.dossier) ? sp.dossier : undefined;

  let syncError = "";
  try {
    await syncMailbox();
  } catch (e) {
    syncError = e instanceof Error ? e.message : "erreur inconnue";
  }
  const { items, total, pages } = listThreads({ folder, query: q, page, per: PER });
  const current = folders.find((f) => f.id === folder);
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (folder) u.set("dossier", folder);
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return `/admin/messagerie${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <h2 className="mb-3 text-lg font-semibold">{current ? current.name : folder === "none" ? "Sans dossier" : "Toutes les conversations"}</h2>
      {syncError && (
        <Card tone="alert" className="mb-4">
          <p className="font-semibold">La dernière actualisation a échoué.</p>
          <p className="mt-1 break-words text-sm text-mute">{syncError.slice(0, 250)} — les messages déjà récupérés restent consultables.</p>
        </Card>
      )}
      <form action="/admin/messagerie" method="get" role="search" className="mb-5 flex flex-wrap items-center gap-2">
        {folder && <input type="hidden" name="dossier" value={folder} />}
        <input className="input !w-auto min-w-56 flex-1" type="search" name="q" defaultValue={q} placeholder="Rechercher (objet, expéditeur, texte)…" aria-label="Rechercher" maxLength={80} />
        <button className="btn btn-primary btn-sm">Rechercher</button>
        {q && (
          <Link href={folder ? `/admin/messagerie?dossier=${folder}` : "/admin/messagerie"} className="btn btn-ghost btn-sm">
            Effacer
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <Empty>{q ? "Aucun résultat." : "Aucune conversation ici."}</Empty>
      ) : (
        <>
          <p className="mb-3 text-sm text-mute">
            {total} conversation{total > 1 ? "s" : ""}
          </p>
          <div className="grid gap-2">
            {items.map((t) => (
              <Link key={t.id} href={`/admin/messagerie/${t.id}`} className="block">
                <Card tone={t.unread ? "alert" : undefined}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className={`min-w-0 break-words ${t.unread ? "font-semibold" : ""}`}>{t.subject || "(sans objet)"}</p>
                    <span className="font-mono text-xs text-mute">{frDate(t.last_at)}</span>
                  </div>
                  <p className="mt-1 break-words text-sm text-mute">
                    {t.last_box === "sent" ? `Envoyé${t.last_by ? ` par ${t.last_by}` : ""} à ${t.last_to}` : `Reçu de ${t.last_from}`}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="pill pill-info">
                      {t.n} message{t.n > 1 ? "s" : ""}
                    </span>
                    {t.unread > 0 && (
                      <span className="pill pill-alert">
                        {t.unread} non lu{t.unread > 1 ? "s" : ""}
                      </span>
                    )}
                    {t.folder_name && <span className="pill pill-ok">{t.folder_name}</span>}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-5 flex items-center gap-3 text-sm">
              {page > 1 && (
                <Link href={href(page - 1)} className="btn btn-ghost btn-sm">
                  ← Plus récentes
                </Link>
              )}
              <span className="text-mute">
                Page {page} / {pages}
              </span>
              {page < pages && (
                <Link href={href(page + 1)} className="btn btn-ghost btn-sm">
                  Plus anciennes →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
      {current && (
        <div className="mt-8 border-t border-line pt-4">
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
    </>
  );
}
