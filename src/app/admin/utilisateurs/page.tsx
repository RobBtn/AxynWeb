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
                        <div className="flex flex-col items-start gap-2">
                          {/* Le rôle actuel s'affiche en étiquette ; un bouton à part sert à le changer. */}
                          <span className={`pill ${u.role === "admin" ? "pill-ok" : ""}`}>{u.role === "admin" ? "Administrateur" : "Client"}</span>
                          {u.id !== me.id &&
                            (u.role === "admin" ? (
                              <ActionForm
                                action={setUserRoleAction}
                                submit="Retirer les droits admin"
                                variant="danger"
                                confirm={`Retirer les droits d'administration à ${u.name} ? Cette personne redeviendra simple client.`}
                              >
                                <input type="hidden" name="id" value={u.id} />
                                <input type="hidden" name="role" value="client" />
                              </ActionForm>
                            ) : (
                              <ActionForm
                                action={setUserRoleAction}
                                submit="Donner les droits admin"
                                variant="ghost"
                                confirm={`Donner les droits d'administration à ${u.name} ? Cette personne verra tous les clients, sites et prospects.`}
                              >
                                <input type="hidden" name="id" value={u.id} />
                                <input type="hidden" name="role" value="admin" />
                              </ActionForm>
                            ))}
                        </div>
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
