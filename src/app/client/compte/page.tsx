import ActionForm from "@/components/ActionForm";
import { Card, PageTitle, frDate } from "@/components/Shell";
import { changePassword, requestDeletion } from "@/app/actions/client";
import { requireUser } from "@/lib/auth";
import { get } from "@/lib/db";

export default async function ClientAccount() {
  const user = await requireUser("client");
  const row = get<{ deletion_requested_at: string | null }>("SELECT deletion_requested_at FROM users WHERE id = ?", user.id);

  return (
    <>
      <PageTitle kicker="Compte" title="Compte & données" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Mot de passe">
          <ActionForm action={changePassword} submit="Changer le mot de passe" reset className="flex flex-col gap-3">
            <label className="field">
              Mot de passe actuel
              <input className="input" type="password" name="current" required autoComplete="current-password" />
            </label>
            <label className="field">
              Nouveau mot de passe (12 caractères minimum)
              <input className="input" type="password" name="next" required minLength={12} maxLength={200} autoComplete="new-password" />
            </label>
          </ActionForm>
        </Card>

        <Card title="Vos données personnelles">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-mute">Nom</dt>
              <dd>{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mute">E-mail</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-mute">Entreprise</dt>
              <dd>{user.company || "—"}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-mute">
            Conformément au RGPD, vous pouvez récupérer toutes vos données ou demander leur suppression à tout moment.
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-3">
            <a href="/api/export" className="btn btn-ghost btn-sm">
              Télécharger mes données (JSON)
            </a>
            {row?.deletion_requested_at ? (
              <span className="pill pill-warn">Suppression demandée le {frDate(row.deletion_requested_at)}</span>
            ) : (
              <ActionForm
                action={requestDeletion}
                submit="Demander la suppression du compte"
                variant="danger"
                confirm="Confirmer la demande de suppression de votre compte et de vos données ?"
                className="flex flex-col gap-2"
              />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
