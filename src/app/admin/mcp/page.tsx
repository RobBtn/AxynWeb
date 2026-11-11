import { headers } from "next/headers";
import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageTitle, frDate } from "@/components/Shell";
import { createTokenAction, revokeTokenAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { all, type TokenRow } from "@/lib/db";
import { tools } from "@/lib/mcp-tools";

export default async function AdminMcp() {
  await requireUser("admin");
  const tokens = all<TokenRow>("SELECT * FROM api_tokens ORDER BY created_at DESC");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = `${proto}://${host}/api/mcp`;

  return (
    <>
      <PageTitle kicker="Administration" title="Claude (MCP)" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Créer un jeton d'accès">
          <ActionForm action={createTokenAction} submit="Générer un jeton" reset className="flex flex-col gap-3">
            <label className="field">
              Nom du jeton
              <input className="input" name="name" placeholder="Claude — poste de travail" maxLength={60} />
            </label>
          </ActionForm>
          <p className="mt-4 text-xs text-mute">
            Le jeton donne un accès administrateur complet via Claude. Il n&apos;est stocké que sous forme
            d&apos;empreinte : gardez-le secret et révoquez-le au moindre doute.
          </p>
        </Card>

        <Card title="2. Brancher Claude">
          <p className="text-sm text-bone/80">Dans un terminal, avec Claude Code :</p>
          <pre className="mt-3 overflow-x-auto zone-dark rounded-xl p-4 font-mono text-xs leading-relaxed">
            {`claude mcp add --transport http webcrea ${url} \\\n  --header "Authorization: Bearer VOTRE_JETON"`}
          </pre>
          <p className="mt-4 text-sm text-bone/80">Puis demandez par exemple :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-mute">
            <li>« Crée un site pour la boulangerie Dupont à partir du modèle Aurore. »</li>
            <li>« Génère les sites des briefs en attente. »</li>
            <li>« Traite les nouvelles demandes de modification. »</li>
          </ul>
        </Card>
      </div>

      <Card title="Jetons" className="mt-6">
        {tokens.length === 0 ? (
          <Empty>Aucun jeton.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Créé</th>
                  <th>Dernière utilisation</th>
                  <th>État</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{frDate(t.created_at)}</td>
                    <td>{frDate(t.last_used_at)}</td>
                    <td>
                      <span className={`pill ${t.revoked_at ? "pill-bad" : "pill-ok"}`}>{t.revoked_at ? "révoqué" : "actif"}</span>
                    </td>
                    <td className="text-right">
                      {!t.revoked_at && (
                        <ActionForm action={revokeTokenAction} submit="Révoquer" variant="danger" confirm={`Révoquer le jeton « ${t.name} » ?`}>
                          <input type="hidden" name="id" value={t.id} />
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`Outils exposés à Claude (${tools.length})`} className="mt-6">
        <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {tools.map((t) => (
            <li key={t.name} className="text-sm">
              <code className="font-mono text-accent">{t.name}</code>
              <span className="mt-0.5 block text-mute">{t.description.split("\n")[0]}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
