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
      <PageTitle kicker="Administration" title="Messagerie">
        <Link href="/admin/messagerie" className="btn btn-ghost btn-sm">
          Récap
        </Link>
        <Link href="/admin/messagerie/conversations" className="btn btn-ghost btn-sm">
          Conversations
        </Link>
        <Link href="/admin/messagerie/nouveau" className="btn btn-primary btn-sm">
          + Nouveau message
        </Link>
      </PageTitle>
      <p className="mb-4 text-sm text-mute">Boîte partagée entre tous les administrateurs : {inboxAddress}. Les messages s&apos;affichent tels que reçus ; scripts et images distantes sont bloqués.</p>
      {children}
    </>
  );
}
