import ActionForm from "@/components/ActionForm";
import DomainPublication, { DomainHelp } from "@/components/DomainPublication";
import { Card, Empty, PageTitle, frDate } from "@/components/Shell";
import { addDomainAction, deleteDomainAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { listDomains, listSites } from "@/lib/data";

export default async function AdminDomains() {
  await requireUser("admin");
  const domains = listDomains();
  const sites = listSites();
  return (
    <>
      <PageTitle kicker="Administration" title="Domaines" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="min-w-0">
          {domains.length === 0 ? (
            <Empty>Aucun domaine.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Domaine</th>
                    <th>Site</th>
                    <th>Publication</th>
                    <th>Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr key={d.id}>
                      <td className="min-w-[12rem]">
                        <span className="block font-mono">{d.name}</span>
                        {d.registrar && <span className="block text-xs text-mute">{d.registrar}</span>}
                        <div className="mt-2">
                          <ActionForm action={deleteDomainAction} submit="Retirer" variant="danger" confirm={`Retirer ${d.name} de la liste ?`}>
                            <input type="hidden" name="id" value={d.id} />
                          </ActionForm>
                        </div>
                      </td>
                      <td>{d.site_name ?? "—"}</td>
                      <td>
                        <DomainPublication name={d.name} siteStatus={d.site_status} />
                      </td>
                      <td>
                        <div className="flex flex-col items-start gap-1.5">
                          <span>
                            {frDate(d.expires_at)}
                            {d.days_left !== null && d.days_left < 30 && (
                              <span className="pill pill-bad ml-2">{Math.max(d.days_left, 0)} j</span>
                            )}
                          </span>
                          <span className={`pill ${d.auto_renew ? "pill-ok" : "pill-warn"}`}>
                            {d.auto_renew ? "renouvellement auto" : "renouvellement manuel"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Ajouter un domaine" className="h-fit">
          <ActionForm action={addDomainAction} submit="Ajouter" reset className="flex flex-col gap-3">
            <label className="field">
              Nom de domaine
              <input className="input" name="name" required placeholder="mon-site.fr" maxLength={253} />
            </label>
            <label className="field">
              Site rattaché
              <select className="input" name="site" defaultValue="">
                <option value="">— Aucun —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Registrar
              <input className="input" name="registrar" placeholder="OVHcloud, Gandi…" maxLength={60} />
            </label>
            <label className="field">
              Date d&apos;expiration
              <input className="input" type="date" name="expiresAt" />
            </label>
            <label className="flex items-center gap-3 text-sm text-mute">
              <input type="checkbox" name="autoRenew" defaultChecked className="size-4 accent-accent" />
              Renouvellement automatique
            </label>
          </ActionForm>
          <p className="mt-4 text-xs text-mute">
            Un domaine rattaché à un site « En ligne » est servi automatiquement une fois son DNS relié au serveur. L&apos;achat et le
            renouvellement se font chez le registrar.
          </p>
        </Card>

        <Card title="Relier le domaine d'un client" className="h-fit lg:col-start-2" tone="info">
          <DomainHelp admin />
        </Card>
      </div>
    </>
  );
}
