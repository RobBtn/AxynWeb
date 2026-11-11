import { getUser } from "@/lib/auth";
import { all, audit } from "@/lib/db";

/** Droit d'accès et à la portabilité (RGPD art. 15 et 20) : export JSON des données du compte. */
export async function GET() {
  const user = await getUser();
  if (!user) return new Response("Non autorisé", { status: 401 });

  const sites = all("SELECT id, slug, name, kind, template_id, content, brief, status, created_at, updated_at FROM sites WHERE client_id = ?", user.id);
  const requests = all("SELECT id, site_id, title, body, status, created_at, updated_at FROM requests WHERE client_id = ?", user.id);
  const messages = all(
    `SELECT m.request_id, m.author_name, m.author_role, m.body, m.created_at
       FROM request_messages m JOIN requests r ON r.id = m.request_id WHERE r.client_id = ?`,
    user.id
  );
  const domains = all(
    "SELECT d.name, d.registrar, d.expires_at, d.auto_renew FROM domains d JOIN sites s ON s.id = d.site_id WHERE s.client_id = ?",
    user.id
  );
  audit(user.email, "account.export");

  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), account: { email: user.email, name: user.name, company: user.company }, sites, domains, requests, messages },
    null,
    2
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mes-donnees.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
