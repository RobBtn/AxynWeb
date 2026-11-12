import ActionForm from "@/components/ActionForm";
import { Card, PageTitle } from "@/components/Shell";
import { sendTestMailAction } from "@/app/actions/admin";
import { changePassword } from "@/app/actions/client";
import { requireUser } from "@/lib/auth";
import { mailConfigured, mailSettings, signupAvailable } from "@/lib/mail";

export default async function AdminAccount() {
  const user = await requireUser("admin");
  const signup = signupAvailable();
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

        <Card title="Envoi d'e-mails" tone={mailConfigured ? "ok" : "alert"} className="lg:col-span-2">
          {mailConfigured ? (
            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-mute">Serveur SMTP</dt>
                <dd className="font-mono">
                  {mailSettings.host}:{mailSettings.port}
                </dd>
              </div>
              <div>
                <dt className="text-mute">Expéditeur</dt>
                <dd className="font-mono break-all">{mailSettings.from}</dd>
              </div>
              <div>
                <dt className="text-mute">Inscriptions publiques</dt>
                <dd>{signup ? "Ouvertes" : "Fermées (SIGNUP_OPEN=false)"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm">
              <strong>Aucun serveur SMTP n&apos;est configuré.</strong>{" "}
              {process.env.NODE_ENV === "production"
                ? "Aucun e-mail ne part et les inscriptions publiques sont fermées. Renseignez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS et SMTP_FROM dans .env.local, puis redémarrez l'application."
                : "En développement, les e-mails s'affichent dans la console du serveur."}
            </p>
          )}
          <ActionForm action={sendTestMailAction} submit={`Envoyer un e-mail de test à ${user.email}`} className="mt-4 flex flex-col gap-2" />
        </Card>
      </div>
    </>
  );
}
