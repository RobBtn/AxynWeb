import Link from "next/link";
import { Empty, PageTitle, frDate, toneClass, type Tone } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { REQUEST_STATUSES, listRequests, statusLabel } from "@/lib/data";

// Couleur de chaque colonne : à traiter (jaune), en cours (bleu), terminé (vert).
const columnTone: Record<string, Tone> = { new: "alert", in_progress: "info", done: "ok" };

/** Tableau Kanban des demandes de modification. */
export default async function AdminRequests() {
  await requireUser("admin");
  const requests = listRequests();
  return (
    <>
      <PageTitle kicker="Administration" title="Demandes" />
      <div className="grid gap-4 lg:grid-cols-3">
        {REQUEST_STATUSES.map((status) => {
          const col = requests.filter((r) => r.status === status);
          return (
            <section key={status} className={`glass rounded-2xl p-4 ${toneClass(columnTone[status])}`}>
              <h2 className="mb-4 flex items-center justify-between px-2 text-sm font-semibold">
                {statusLabel[status]}
                <span className="rounded-full border border-bone bg-ink-2 px-2 py-0.5 font-mono text-xs">{col.length}</span>
              </h2>
              <div className="flex flex-col gap-3">
                {col.length === 0 && <Empty>Vide</Empty>}
                {col.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/demandes/${r.id}`}
                    className="rounded-2xl border border-bone bg-ink-2 p-4 transition hover:-translate-y-0.5"
                  >
                    <p className="font-medium">{r.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-mute">{r.body}</p>
                    <p className="mt-3 text-xs text-mute">
                      {r.site_name} · {r.client_name ?? "—"} · {frDate(r.updated_at)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
