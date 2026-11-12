import ActionForm from "@/components/ActionForm";
import { Card, Empty, frDate } from "@/components/Shell";
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
      <header className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1">
        <h1 className="display text-3xl md:text-4xl">Utilisateurs</h1>
        <span className="font-mono text-xs text-mute">
          {users.length} compte{users.length > 1 ? "s" : ""} · {admins} administrateur{admins > 1 ? "s" : ""}
        </span>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="overflow-hidden rounded-3xl border border-line bg-ink-2 shadow-sm" aria-label="Comptes">
          {users.length === 0 ? (
            <div className="p-6">
              <Empty>Aucun utilisateur.</Empty>
            </div>
          ) : (
            <ul>
              {users.map((u) => (
                <li key={u.id} className="flex flex-col gap-4 border-b border-line px-5 py-5 last:border-b-0 md:flex-row md:items-center md:justify-between md:px-7">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink-3 text-sm font-semibold uppercase" aria-hidden="true">
                      {u.name.trim().charAt(0) || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words font-medium">
                        {u.name}
                        {u.id === me.id && <span className="ml-2 font-mono text-xs font-normal text-mute">(vous)</span>}
                      </p>
                      <p className="break-all text-sm text-mute">
                        {u.email}
                        {u.company && ` · ${u.company}`}
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        {u.sites} site{u.sites > 1 ? "s" : ""} · depuis le {frDate(u.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Rôle actuel, puis (à part) le bouton pour le changer : en ligne, qui passe à la ligne au besoin. */}
                  <div className="flex flex-wrap items-center gap-3 md:shrink-0 md:justify-end">
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
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line bg-ink-3/50 px-5 py-4 text-xs text-mute md:px-7">
            Un administrateur voit tous les clients, sites, prospects et demandes, et peut donner ou retirer ces droits. Les nouveaux comptes créés par inscription
            sont toujours des clients.
          </p>
        </section>

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
