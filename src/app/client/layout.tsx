import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { listRequests } from "@/lib/data";

export const metadata: Metadata = { title: "Espace client", robots: { index: false } };

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("client");
  const all = listRequests({ clientId: user.id });
  const open = all.filter((r) => r.status !== "done").length;
  const hasSite = !!get("SELECT 1 FROM sites WHERE client_id = ?", user.id);
  // Pas encore de site : le geste le plus utile est de demander un devis.
  const starting = !hasSite && all.length === 0;
  return (
    <Shell
      user={user}
      title="Client"
      cta={starting ? { href: "/client/devis", label: "Demander un devis" } : { href: "/client/demandes", label: "Demander une modification" }}
      items={[
        { href: "/client", label: "Mes sites" },
        ...(hasSite ? [] : [{ href: "/client/devis", label: "Demander un devis" }]),
        { href: "/client/demandes", label: "Demandes", badge: open },
        { href: "/client/domaines", label: "Domaines" },
        { href: "/client/compte", label: "Compte & données" },
      ]}
    >
      {children}
    </Shell>
  );
}
