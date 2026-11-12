import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageTitle, frDate } from "@/components/Shell";
import { createUserAction, setUserRoleAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { all, type UserRow } from "@/lib/db";

type Row = UserRow & { sites: number };

export default async function AdminUsers() {
  const me = await requireUser("admin");
  const users = all<Row>(
    `SELECT u.*, (SELECT COUNT(*) FROM sites s WHERE s.client_id = u.id) AS sites
       FROM users u ORDER BY CASE u.role WHEN 'admin' THEN 0 ELSE 1 END, u.created_at DESC`
  );
  const admins = users.filter((u) => u.role === "admin").length;

  return (
    <>
      <PageTitle kicker="Administration" title="Utilisateurs" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          {users.length === 0 ? (
            <Empty>Aucun utilisateur.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Sites</th>
                    <th>Depuis</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="block font-medium">
                          {u.name}
                          {u.id === me.id && <span className="ml-2 font-mono text-xs font-normal text-mute">(vous)</span>}
                        </span>
                        <span className="text-xs text-mute">
                          {u.email}
                          {u.company && ` · ${u.company}`}
                        </span>
                      </td>
                      <td>
                        {u.id === me.id ? (
                          <span className="pill pill-ok">Administrateur</span>
                        ) : (
                          <ActionForm
                            action={setUserRoleAction}
                            submit="OK"
                            variant="ghost"
                            className="flex items-center gap-2"
                            confirm={
                              u.role === "admin"
                                ? `Retirer les droits d'administration à ${u.name} ? Elle ou il redeviendra simple client.`
                                : undefined
                            }
                          >
                            <input type="hidden" name="id" value={u.id} />
                            <select className="input !w-auto !py-2 text-sm" name="role" defaultValue={u.role} aria-label={`Rôle de ${u.name}`}>
                              <option value="client">Client</option>
                              <option value="admin">Administrateur</option>
                            </select>
                          </ActionForm>
                        )}
                      </td>
                      <td>{u.sites}</td>
                      <td>{frDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-mute">
            {admins} administrateur{admins > 1 ? "s" : ""}. Un administrateur voit tous les clients, sites, prospects et demandes, et
            peut donner ou retirer ces droits. Les nouveaux comptes créés par inscription sont toujours des clients.
          </p>
        </Card>

        <Card title="Nouveau compte" className="h-fit">
          <ActionForm action={createUserAction} submit="Créer le compte" reset className="flex flex-col gap-3">
            <label className="field">
              Nom
              <input className="input" name="name" required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              E-mail
              <input className="input" type="email" name="email" required maxLength={120} />
            </label>
            <label className="field">
              Rôle
              <select className="input" name="role" defaultValue="client">
                <option value="client">Client</option>
                <option value="admin">Administrateur</option>
              </select>
            </label>
          </ActionForm>
          <p className="mt-4 text-xs text-mute">
            Un mot de passe provisoire est généré et affiché une seule fois. La personne pourra le changer depuis son compte.
          </p>
        </Card>
      </div>
    </>
  );
}
