import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { overview } from "@/lib/data";

export const metadata: Metadata = { title: "Administration", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  const o = overview();
  return (
    <Shell
      user={user}
      title="Admin"
      cta={{ href: "/admin/sites/nouveau", label: "+ Nouveau site" }}
      items={[
        { href: "/admin", label: "Vue d'ensemble" },
        { href: "/admin/sites", label: "Sites", badge: o.briefsPending },
        { href: "/admin/clients", label: "Clients" },
        { href: "/admin/utilisateurs", label: "Utilisateurs" },
        { href: "/admin/demandes", label: "Demandes", badge: o.requestsOpen },
        { href: "/admin/domaines", label: "Domaines", badge: o.domainsExpiring },
        { href: "/admin/prospects", label: "Prospects", badge: o.leadsNew },
        { href: "/admin/messagerie", label: "Messagerie" },
        { href: "/admin/mcp", label: "Claude (MCP)" },
        { href: "/admin/compte", label: "Mon compte" },
      ]}
    >
      {children}
    </Shell>
  );
}
