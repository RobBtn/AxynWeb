import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import { PageTitle } from "@/components/Shell";
import { createFolderAction, syncAction } from "@/app/actions/mailbox";
import { requireUser } from "@/lib/auth";
import { inboxAddress, inboxConfigured, listFolders, mailCounts } from "@/lib/inbox";

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
  const folders = listFolders();
  const counts = mailCounts();
  return (
    <>
      <PageTitle kicker="Administration" title="Messagerie">
        <Link href="/admin/messagerie/nouveau" className="btn btn-primary btn-sm">
          + Nouveau message
        </Link>
      </PageTitle>
      <p className="mb-5 text-sm text-mute">
        Boîte partagée entre tous les administrateurs : {inboxAddress}. Seul le texte des messages est affiché (ni images distantes ni scripts).
      </p>
      <div className="grid items-start gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="flex flex-col gap-4">
          <nav aria-label="Messagerie" className="flex flex-col gap-1">
            <Link href="/admin/messagerie" className="btn btn-ghost btn-sm justify-between">
              Toutes les conversations <span className="font-mono text-xs">{counts.threads}</span>
            </Link>
            <Link href="/admin/messagerie?dossier=none" className="btn btn-ghost btn-sm justify-between">
              Sans dossier <span className="font-mono text-xs">{counts.unfiled}</span>
            </Link>
            {folders.map((f) => (
              <Link key={f.id} href={`/admin/messagerie?dossier=${f.id}`} className="btn btn-ghost btn-sm justify-between">
                <span className="truncate">{f.name}</span>
                <span className="font-mono text-xs">
                  {f.unread > 0 && <span className="mr-1 text-accent">{f.unread} non lu{f.unread > 1 ? "s" : ""} ·</span>}
                  {f.n}
                </span>
              </Link>
            ))}
            <Link href="/admin/messagerie/recap" className="btn btn-ghost btn-sm mt-2 justify-between">
              Récap envoyés et réponses
            </Link>
          </nav>
          <ActionForm action={createFolderAction} submit="Créer" reset className="flex flex-col gap-2">
            <label className="field">
              Nouveau dossier
              <input className="input" name="name" maxLength={40} placeholder="Ex. Devis en cours" required />
            </label>
          </ActionForm>
          <ActionForm action={syncAction} submit="Actualiser la boîte" variant="ghost" className="flex flex-col gap-2" />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
