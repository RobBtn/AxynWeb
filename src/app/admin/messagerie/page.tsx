import Link from "next/link";
import { Card, Empty, frDate } from "@/components/Shell";
import { recapTotals, repliesRecap, sentRecap, syncMailbox } from "@/lib/inbox";

export const dynamic = "force-dynamic";

export default async function MessagerieRecap() {
  await syncMailbox().catch(() => {});
  const totals = recapTotals();
  const sent = sentRecap();
  const replies = repliesRecap();

  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">Récap des envois et des réponses</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card tone="info">
          <p className="text-2xl font-semibold">{totals.sent}</p>
          <p className="text-sm text-mute">mails envoyés</p>
        </Card>
        <Card tone="ok">
          <p className="text-2xl font-semibold">{totals.answered}</p>
          <p className="text-sm text-mute">ont reçu une réponse</p>
        </Card>
        <Card tone="alert">
          <p className="text-2xl font-semibold">{totals.waiting}</p>
          <p className="text-sm text-mute">sans réponse</p>
        </Card>
      </div>

      <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-mute">Mails envoyés · {sent.length}</h3>
      {sent.length === 0 ? (
        <Empty>Aucun mail envoyé.</Empty>
      ) : (
        <div className="mb-8 grid gap-2">
          {sent.map((s) => (
            <Link key={s.id} href={`/admin/messagerie/conversations?c=${s.thread_id}`} className="block">
              <Card tone={s.reply_at ? "ok" : undefined}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="min-w-0 break-words font-medium">{s.subject || "(sans objet)"}</p>
                  <span className="font-mono text-xs text-mute">{frDate(s.date)}</span>
                </div>
                <p className="mt-1 break-words text-sm text-mute">
                  À {s.to_addr}
                  {s.sent_by && ` · par ${s.sent_by}`}
                </p>
                <p className="mt-2 text-xs">
                  {s.reply_at ? (
                    <span className="pill pill-ok">
                      Réponse de {s.reply_from} le {frDate(s.reply_at)}
                    </span>
                  ) : (
                    <span className="pill pill-alert">Pas de réponse</span>
                  )}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-mute">Réponses reçues · {replies.length}</h3>
      {replies.length === 0 ? (
        <Empty>Aucune réponse reçue pour l&apos;instant.</Empty>
      ) : (
        <div className="grid gap-2">
          {replies.map((r) => (
            <Link key={r.id} href={`/admin/messagerie/conversations?c=${r.thread_id}`} className="block">
              <Card tone={r.seen ? undefined : "alert"}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className={`min-w-0 break-words ${r.seen ? "" : "font-semibold"}`}>{r.from_addr}</p>
                  <span className="font-mono text-xs text-mute">{frDate(r.date)}</span>
                </div>
                <p className="mt-1 break-words text-sm text-mute">
                  {r.subject || "(sans objet)"}
                  {r.folder_name && ` · dossier ${r.folder_name}`}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
