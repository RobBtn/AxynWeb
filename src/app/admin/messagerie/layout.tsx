import Link from "next/link";
import { PageTitle } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { inboxAddress, inboxConfigured } from "@/lib/inbox";

export default async function MessagerieLayout({ children }: { children: React.ReactNode }) {
  await requireUser("admin");
  if (!inboxConfigured) {
    return (
      <>
        <PageTitle kicker="Administration" title="Messagerie" />
        <p className="max-w-2xl text-sm text-mute">
          La boîte mail n&apos;est pas configurée. Ajoute <code>SMTP_HOST</code>, <code>SMTP_USER</code> et <code>SMTP_PASS</code> dans le{" "}
          <code>.env.local</code> du serveur (et <code>IMAP_HOST</code> si l&apos;adresse de lecture n&apos;est pas <code>imap.</code> suivi du domaine du SMTP), puis
          redémarre l&apos;application.
        </p>
      </>
    );
  }
  return (
    <>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="display text-3xl md:text-4xl">Messagerie</h1>
          <span className="truncate font-mono text-xs text-mute">Boîte partagée · {inboxAddress}</span>
        </div>
        <Link href="/admin/messagerie/nouveau" className="btn btn-primary btn-sm">
          + Nouveau message
        </Link>
      </header>
      {children}
    </>
  );
}
