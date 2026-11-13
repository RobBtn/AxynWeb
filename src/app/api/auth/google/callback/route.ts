import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, rateLimit } from "@/lib/auth";
import { audit, get, newId, run, type UserRow } from "@/lib/db";
import { finishGoogleFlow, GOOGLE_COOKIE, googleConfigured, type GoogleFlow } from "@/lib/google";
import { hashPassword, randomToken } from "@/lib/password";

const fail = (code: string): never => redirect(`/connexion?erreur=${code}`);

function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Retour de Google. Règles :
 *  - compte déjà lié à ce Google → connexion ;
 *  - compte existant avec la même adresse (vérifiée par Google) et pas encore lié → liaison puis connexion ;
 *  - aucun compte → création d'un compte client, sauf si SIGNUP_OPEN=false.
 */
export async function GET(req: Request) {
  if (!googleConfigured()) fail("google");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`google:${ip}`, 20, 900_000)) fail("tentatives");

  const store = await cookies();
  const raw = store.get(GOOGLE_COOKIE)?.value;
  store.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });

  const params = new URL(req.url).searchParams;
  if (params.get("error")) fail("annule");
  const code = params.get("code");
  const state = params.get("state");

  let flow: GoogleFlow | null = null;
  try {
    flow = raw ? (JSON.parse(raw) as GoogleFlow) : null;
  } catch {}
  if (!code || !state || !flow?.state || !sameString(state, flow.state)) fail("google");

  const profile = await finishGoogleFlow(code!, flow!).catch(() => null);
  if (!profile) fail("google");
  const { sub, email, name } = profile!;

  let user = get<UserRow & { google_sub: string | null }>("SELECT * FROM users WHERE google_sub = ?", sub);
  if (!user) {
    const byEmail = get<UserRow & { google_sub: string | null }>("SELECT * FROM users WHERE email = ?", email);
    if (byEmail) {
      // Adresse déjà liée à un autre compte Google : on refuse plutôt que d'écraser.
      if (byEmail.google_sub) {
        audit(email, "login.google.refused", ip);
        fail("google");
      }
      run("UPDATE users SET google_sub = ? WHERE id = ?", sub, byEmail.id);
      audit(email, "login.google.linked", ip);
      user = byEmail;
    } else {
      // Google a déjà vérifié l'adresse : pas besoin du code par e-mail, seul SIGNUP_OPEN compte.
      if (process.env.SIGNUP_OPEN === "false") fail("ferme");
      const id = newId();
      const displayName = (name.trim() || email.split("@")[0]).slice(0, 80).padEnd(2, ".");
      // Mot de passe aléatoire jamais communiqué : le compte se connecte par Google
      // (ou après une réinitialisation par l'admin).
      run(
        "INSERT INTO users (id, email, name, company, role, password_hash, google_sub) VALUES (?, ?, ?, '', 'client', ?, ?)",
        id,
        email,
        displayName,
        hashPassword(randomToken()),
        sub
      );
      audit(email, "signup.google", ip);
      user = get("SELECT * FROM users WHERE id = ?", id);
    }
  }

  await createSession(user!.id);
  audit(user!.email, "login.ok", "google");
  redirect(user!.role === "admin" ? "/admin" : "/client");
}
