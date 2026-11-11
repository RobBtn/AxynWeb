import Link from "next/link";
import SiteProgress from "@/components/SiteProgress";
import { Empty, PageTitle, StatusPill, frDate } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { SITE_STATUSES, listSites, siteProgress, statusLabel } from "@/lib/data";
import { getTemplate } from "@/lib/templates";

export default async function AdminSites({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireUser("admin");
  const { statut } = await searchParams;
  const filter = (SITE_STATUSES as readonly string[]).includes(statut ?? "") ? statut : undefined;
  const all = listSites();
  const sites = filter ? all.filter((s) => s.status === filter) : all;

  const chip = (active: boolean) => `btn btn-sm ${active ? "btn-dark" : "btn-ghost"}`;

  return (
    <>
      <PageTitle kicker="Administration" title="Sites">
        <Link href="/admin/sites/nouveau" className="btn btn-primary">
          + Nouveau site
        </Link>
      </PageTitle>

      <nav aria-label="Filtrer par statut" className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/sites" className={chip(!filter)}>
          Tous · {all.length}
        </Link>
        {SITE_STATUSES.map((s) => (
          <Link key={s} href={`/admin/sites?statut=${s}`} className={chip(filter === s)}>
            {statusLabel[s]} · {all.filter((x) => x.status === s).length}
          </Link>
        ))}
      </nav>

      {sites.length === 0 ? (
        <Empty>Aucun site ici. Créez-en un avec « Nouveau site ».</Empty>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {sites.map((s) => {
            const t = getTemplate(s.template_id);
            return (
              <Link key={s.id} href={`/admin/sites/${s.id}`} className="glass lift flex flex-col overflow-hidden rounded-2xl">
                <div className="relative aspect-[16/8] overflow-hidden border-b border-bone" style={{ background: t?.preview.bg ?? "#10130b" }}>
                  {t ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/previews/${t.id}.jpg`} alt="" className="absolute inset-0 size-full object-cover object-top" />
                  ) : (
                    <span className="display absolute inset-0 grid place-items-center text-5xl text-[#cfe3c4]">IA</span>
                  )}
                  <span className="absolute left-3 top-3">
                    <StatusPill status={s.status} label={statusLabel[s.status]} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div>
                    <p className="display text-2xl">{s.name}</p>
                    <p className="mt-1 text-sm text-mute">
                      {t ? `Modèle ${t.name}` : "Sur-mesure"} · {s.client_name ?? "sans client"} · {frDate(s.updated_at)}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <SiteProgress steps={siteProgress(s)} compact />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
