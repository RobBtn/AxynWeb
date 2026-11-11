import Link from "next/link";
import { notFound } from "next/navigation";
import Thread from "@/components/Thread";
import { PageTitle } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { get, type RequestRow } from "@/lib/db";

export default async function AdminRequest({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("admin");
  const row = get<RequestRow & { site_name: string }>(
    "SELECT r.*, s.name AS site_name FROM requests r JOIN sites s ON s.id = r.site_id WHERE r.id = ?",
    (await params).id
  );
  if (!row) notFound();
  return (
    <>
      <PageTitle kicker="Demande" title={row.title}>
        <div className="flex gap-2">
          <Link href={`/admin/sites/${row.site_id}`} className="btn btn-ghost btn-sm">
            Ouvrir le site
          </Link>
          <Link href="/admin/demandes" className="btn btn-ghost btn-sm">
            ← Demandes
          </Link>
        </div>
      </PageTitle>
      <Thread request={row} siteName={row.site_name} admin />
    </>
  );
}
