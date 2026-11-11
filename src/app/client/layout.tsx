import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { listRequests } from "@/lib/data";

export const metadata: Metadata = { title: "Espace client", robots: { index: false } };

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("client");
  const open = listRequests({ clientId: user.id }).filter((r) => r.status !== "done").length;
  return (
    <Shell
      user={user}
      title="Client"
      cta={{ href: "/client/demandes", label: "Demander une modification" }}
      items={[
        { href: "/client", label: "Mes sites" },
        { href: "/client/demandes", label: "Demandes", badge: open },
        { href: "/client/domaines", label: "Domaines" },
        { href: "/client/compte", label: "Compte & données" },
      ]}
    >
      {children}
    </Shell>
  );
}
