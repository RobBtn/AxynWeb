import DomainPublication, { DomainHelp } from "@/components/DomainPublication";
import { Card, Empty, PageTitle, frDate } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { listDomains } from "@/lib/data";

export default async function ClientDomains() {
  const user = await requireUser("client");
  const domains = listDomains(user.id);
  return (
    <>
      <PageTitle kicker="Noms de domaine" title="Domaines" />
      <Card>
        {domains.length === 0 ? (
          <Empty>Aucun nom de domaine rattaché à vos sites pour l&apos;instant.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Domaine</th>
                  <th>Site</th>
                  <th>Publication</th>
                  <th>Expiration</th>
                  <th>Renouvellement</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => (
                  <tr key={d.id}>
                    <td className="font-mono">{d.name}</td>
                    <td>{d.site_name ?? "—"}</td>
                    <td>
                      <DomainPublication name={d.name} siteStatus={d.site_status} />
                    </td>
                    <td>
                      {frDate(d.expires_at)}{" "}
                      {d.days_left !== null && d.days_left < 30 && (
                        <span className="pill pill-bad ml-2">{Math.max(d.days_left, 0)} j</span>
                      )}
                    </td>
                    <td>
                      <span className={`pill ${d.auto_renew ? "pill-ok" : "pill-warn"}`}>{d.auto_renew ? "automatique" : "manuel"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-5 text-sm text-mute">
          Vos domaines sont enregistrés à votre nom. Pour un transfert ou un changement, ouvrez une demande.
        </p>
      </Card>
      <Card title="Relier votre nom de domaine à votre site" tone="info" className="mt-6">
        <DomainHelp />
      </Card>
    </>
  );
}
