import ActionForm from "@/components/ActionForm";
import { Card, PageTitle } from "@/components/Shell";
import { changePassword } from "@/app/actions/client";
import { requireUser } from "@/lib/auth";

export default async function AdminAccount() {
  const user = await requireUser("admin");
  return (
    <>
      <PageTitle kicker="Administration" title="Mon compte" />
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
        <Card title="Connecté en tant que">
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-mute">{user.email}</p>
        </Card>
      </div>
    </>
  );
}
