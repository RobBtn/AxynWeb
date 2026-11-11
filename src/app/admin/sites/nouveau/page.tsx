import Link from "next/link";
import AiCreate from "@/components/AiCreate";
import SiteWizard from "@/components/SiteWizard";
import { PageTitle } from "@/components/Shell";
import { aiReady } from "@/lib/ai";
import { requireUser } from "@/lib/auth";
import { listClients } from "@/lib/data";
import { templates } from "@/lib/templates";

export default async function NewSite() {
  await requireUser("admin");
  const clients = listClients().map((c) => ({ id: c.id, name: c.name, email: c.email }));
  return (
    <>
      <PageTitle kicker="Sites" title="Nouveau site">
        <Link href="/admin/sites" className="btn btn-ghost btn-sm">
          ← Sites
        </Link>
      </PageTitle>

      <AiCreate ready={aiReady()} clients={clients} />

      <details className="glass group mt-6 rounded-2xl">
        <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold">
          Créer à la main (choisir le modèle soi-même, ou site sur-mesure)
          <span className="text-xl transition-transform group-open:rotate-45" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="px-6 pb-6">
          <SiteWizard
            templates={templates.map((t) => ({ id: t.id, name: t.name, sector: t.sector, bg: t.preview.bg }))}
            clients={clients}
          />
        </div>
      </details>
    </>
  );
}
