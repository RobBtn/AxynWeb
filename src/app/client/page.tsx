import Link from "next/link";
import { Card, Empty, PageTitle, StatusPill } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all, type SiteRow } from "@/lib/db";
import SiteProgress from "@/components/SiteProgress";
import { listDomains, listRequests, siteProgress, statusLabel } from "@/lib/data";
import { getTemplate } from "@/lib/templates";

export default async function ClientHome() {
  const user = await requireUser("client");
  const sites = all<SiteRow>("SELECT * FROM sites WHERE client_id = ? ORDER BY updated_at DESC", user.id);
  const requests = listRequests({ clientId: user.id }).filter((r) => r.status !== "done").slice(0, 4);
  const expiring = listDomains(user.id).filter((d) => d.days_left !== null && d.days_left < 30);

  return (
    <>
      <PageTitle kicker={`Bonjour ${user.name.split(" ")[0]}`} title="Mes sites" />

      {expiring.map((d) => (
        <div key={d.id} className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/40 bg-coral/10 px-5 py-4 text-sm">
          <span>
            Le domaine <strong>{d.name}</strong> expire dans {Math.max(d.days_left ?? 0, 0)} jour(s).
            {d.auto_renew ? " Le renouvellement automatique est actif." : " Le renouvellement automatique est désactivé."}
          </span>
          <Link href="/client/domaines" className="btn btn-ghost btn-sm">
            Voir
          </Link>
        </div>
      ))}

      {sites.length === 0 ? (
        <Empty>Aucun site pour l&apos;instant. Votre site apparaîtra ici dès sa création.</Empty>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sites.map((s) => {
            const t = getTemplate(s.template_id);
            return (
              <article key={s.id} className="glass overflow-hidden rounded-2xl">
                <div
                  className="relative h-40 overflow-hidden p-6"
                  style={{ background: t?.preview.bg ?? "#161622", color: t?.preview.fg ?? "#f3f1ea" }}
                >
                  <div
                    className="floaty absolute -right-10 -top-14 size-48 rounded-full"
                    style={{
                      background: t
                        ? `radial-gradient(circle at 30% 30%, ${t.colors[2]}, ${t.colors[1]} 35%, ${t.colors[0]} 70%, transparent 72%)`
                        : "radial-gradient(circle at 30% 30%, #fff, #7b5cff 40%, transparent 72%)",
                    }}
                  />
                  <p className="display relative text-4xl">{s.name}</p>
                  <p className="relative mt-1 font-mono text-xs opacity-70">{t ? `Modèle ${t.name}` : "Sur-mesure"}</p>
                </div>
                <div className="px-5 pt-5">
                  <SiteProgress steps={siteProgress(s).filter((p) => !p.label.startsWith("Client"))} compact />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <StatusPill status={s.status} label={statusLabel[s.status]} />
                  <div className="flex gap-2">
                    <a href={`/s/${s.slug}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                      Voir ↗
                    </a>
                    <Link href={`/client/sites/${s.id}`} className="btn btn-primary btn-sm">
                      Modifier
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Card title="Demandes en cours" className="mt-8">
        {requests.length === 0 ? (
          <Empty>Aucune demande en cours.</Empty>
        ) : (
          <ul className="divide-y divide-white/5">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/client/demandes/${r.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-accent">
                  <span>{r.title}</span>
                  <StatusPill status={r.status} label={statusLabel[r.status]} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/client/demandes" className="btn btn-ghost btn-sm mt-4">
          Nouvelle demande
        </Link>
      </Card>
    </>
  );
}
