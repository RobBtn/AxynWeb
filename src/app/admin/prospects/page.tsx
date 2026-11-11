import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageTitle, StatusPill, frDate } from "@/components/Shell";
import { createSiteFromLeadAction, deleteLeadAction, setLeadStatusAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { all, type LeadRow } from "@/lib/db";
import { statusLabel } from "@/lib/data";

export default async function AdminLeads() {
  await requireUser("admin");
  const leads = all<LeadRow>("SELECT * FROM leads ORDER BY created_at DESC");
  return (
    <>
      <PageTitle kicker="Administration" title="Prospects" />
      {leads.length === 0 ? (
        <Empty>Aucune demande de devis pour l&apos;instant.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {leads.map((l) => (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
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
      <p className="mt-6 text-xs text-mute">
        RGPD : les prospects sans suite doivent être supprimés au plus tard 3 ans après le dernier contact.
      </p>
    </>
  );
}
