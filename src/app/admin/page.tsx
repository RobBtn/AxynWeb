import Link from "next/link";
import { Card, Empty, PageTitle, StatusPill, frDate } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { listDomains, listRequests, listSites, overview, statusLabel } from "@/lib/data";

export default async function AdminHome() {
  await requireUser("admin");
  const o = overview();
  const briefs = listSites("brief");
  const requests = listRequests().filter((r) => r.status !== "done").slice(0, 5);
  const expiring = listDomains().filter((d) => d.days_left !== null && d.days_left < 30);
  const log = all<{ id: number; actor: string; action: string; detail: string; created_at: string }>(
    "SELECT * FROM audit ORDER BY id DESC LIMIT 8"
  );

  const kpis = [
    { label: "Clients", value: o.clients, href: "/admin/clients" },
    { label: "Sites en ligne", value: `${o.sitesLive}/${o.sites}`, href: "/admin/sites" },
    { label: "Demandes ouvertes", value: o.requestsOpen, href: "/admin/demandes" },
    { label: "Nouveaux prospects", value: o.leadsNew, href: "/admin/prospects" },
  ];

  return (
    <>
      <PageTitle kicker="Administration" title="Vue d'ensemble">
        <Link href="/admin/sites/nouveau" className="btn btn-primary">
          + Nouveau site
        </Link>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="glass lift rounded-2xl p-6">
            <p className="text-sm text-mute">{k.label}</p>
            <p className="display mt-4 text-6xl">{k.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Briefs à générer">
          {briefs.length === 0 ? (
            <Empty>Aucun brief en attente.</Empty>
          ) : (
            <ul className="divide-y divide-white/5">
              {briefs.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/sites/${s.id}`} className="block py-3 hover:text-accent">
                    <span className="font-medium">{s.name}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-mute">{s.brief}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-mute">
            Demandez à Claude : « génère les sites des briefs en attente ». Il les récupère via le serveur MCP.
          </p>
        </Card>

        <Card title="Demandes à traiter">
          {requests.length === 0 ? (
            <Empty>Rien à traiter.</Empty>
          ) : (
            <ul className="divide-y divide-white/5">
              {requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/demandes/${r.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-accent">
                    <span>
                      <span className="block font-medium">{r.title}</span>
                      <span className="text-xs text-mute">
                        {r.site_name} · {r.client_name ?? "—"}
                      </span>
                    </span>
                    <StatusPill status={r.status} label={statusLabel[r.status]} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Domaines à renouveler (30 jours)">
          {expiring.length === 0 ? (
            <Empty>Aucune échéance proche.</Empty>
          ) : (
            <ul className="divide-y divide-white/5">
              {expiring.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="font-mono text-sm">{d.name}</span>
                  <span className="pill pill-bad">{Math.max(d.days_left ?? 0, 0)} j</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Journal d'activité">
          <ul className="space-y-2 text-sm">
            {log.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-x-4 text-bone/80">
                <span>
                  <span className="font-mono text-xs text-accent">{l.action}</span> {l.detail}
                </span>
                <span className="text-xs text-mute">
                  {l.actor} · {frDate(l.created_at)}
                </span>
              </li>
            ))}
            {log.length === 0 && <li className="text-mute">Aucune activité.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
