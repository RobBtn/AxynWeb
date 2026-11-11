import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageTitle, frDate } from "@/components/Shell";
import { createClientAction, deleteClientAction, resetClientPasswordAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { listClients } from "@/lib/data";

export default async function AdminClients() {
  await requireUser("admin");
  const clients = listClients();
  return (
    <>
      <PageTitle kicker="Administration" title="Clients" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          {clients.length === 0 ? (
            <Empty>Aucun client.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Sites</th>
                    <th>Depuis</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="block font-medium">{c.name}</span>
                        <span className="text-xs text-mute">
                          {c.email}
                          {c.company && ` · ${c.company}`}
                        </span>
                        {c.deletion_requested_at && (
                          <span className="pill pill-bad mt-2">suppression demandée le {frDate(c.deletion_requested_at)}</span>
                        )}
                      </td>
                      <td>{c.sites}</td>
                      <td>{frDate(c.created_at)}</td>
                      <td className="space-y-2 text-right">
                        <ActionForm action={resetClientPasswordAction} submit="Générer un accès" variant="ghost" confirm={`Générer un nouveau mot de passe pour ${c.name} ? L'ancien ne fonctionnera plus.`} className="flex flex-col items-end gap-2">
                          <input type="hidden" name="id" value={c.id} />
                        </ActionForm>
                        <ActionForm
                          action={deleteClientAction}
                          submit="Supprimer"
                          variant="danger"
                          confirm={`Supprimer définitivement le compte de ${c.name} et ses demandes ? Ses sites seront conservés, sans propriétaire.`}
                        >
                          <input type="hidden" name="id" value={c.id} />
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Nouveau client" className="h-fit">
          <ActionForm action={createClientAction} submit="Créer le compte" reset className="flex flex-col gap-3">
            <label className="field">
              Nom
              <input className="input" name="name" required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              E-mail
              <input className="input" type="email" name="email" required maxLength={120} />
            </label>
            <label className="field">
              Entreprise
              <input className="input" name="company" maxLength={120} />
            </label>
          </ActionForm>
          <p className="mt-4 text-xs text-mute">
            Un mot de passe provisoire est généré. Transmettez-le au client par un canal sûr ; il pourra le changer dans
            son espace.
          </p>
        </Card>
      </div>
    </>
  );
}
