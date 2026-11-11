import Link from "next/link";
import { notFound } from "next/navigation";
import Thread from "@/components/Thread";
import { PageTitle } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { get, type RequestRow } from "@/lib/db";

export default async function ClientRequest({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("client");
  const row = get<RequestRow & { site_name: string }>(
    `SELECT r.*, s.name AS site_name FROM requests r JOIN sites s ON s.id = r.site_id
      WHERE r.id = ? AND s.client_id = ?`,
    (await params).id,
    user.id
  );
  if (!row) notFound();
  return (
    <>
      <PageTitle kicker="Demande" title={row.title}>
        <Link href="/client/demandes" className="btn btn-ghost btn-sm">
          ← Toutes les demandes
        </Link>
      </PageTitle>
      <Thread request={row} siteName={row.site_name} />
    </>
  );
}
