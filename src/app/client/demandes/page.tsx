import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageTitle, StatusPill, frDate } from "@/components/Shell";
import { createRequest } from "@/app/actions/client";
import { requireUser } from "@/lib/auth";
import { all, type SiteRow } from "@/lib/db";
import { listRequests, statusLabel } from "@/lib/data";

export default async function ClientRequests() {
  const user = await requireUser("client");
  const sites = all<SiteRow>("SELECT * FROM sites WHERE client_id = ? ORDER BY name", user.id);
  const requests = listRequests({ clientId: user.id });

  return (
    <>
      <PageTitle kicker="Modifications" title="Demandes" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card title="Historique">
          {requests.length === 0 ? (
            <Empty>Vous n&apos;avez encore rien demandé.</Empty>
          ) : (
            <ul className="divide-y divide-white/5">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/client/demandes/${r.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-accent">
                    <span>
                      <span className="block font-medium">{r.title}</span>
                      <span className="text-xs text-mute">
                        {r.site_name} · {frDate(r.updated_at)}
                      </span>
                    </span>
                    <StatusPill status={r.status} label={statusLabel[r.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Nouvelle demande" className="h-fit">
          {sites.length === 0 ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-mute">Les demandes de modification servent une fois votre site créé. Pour démarrer un projet, demandez un devis.</p>
              <Link href="/client/devis" className="btn btn-primary btn-sm">
                Demander un devis →
              </Link>
            </div>
          ) : (
            <ActionForm action={createRequest} submit="Envoyer la demande" className="flex flex-col gap-3">
              <label className="field">
                Site concerné
                <select className="input" name="siteId" required>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Titre
                <input className="input" name="title" required minLength={3} maxLength={120} placeholder="Ajouter une page tarifs" />
              </label>
              <label className="field">
                Description
                <textarea className="input min-h-32" name="body" required minLength={10} maxLength={4000} placeholder="Expliquez ce que vous souhaitez changer…" />
              </label>
            </ActionForm>
          )}
        </Card>
      </div>
    </>
  );
}
