import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { get, run, type UserRow } from "./db";
import { randomToken, sha256 } from "./password";

export const SESSION_COOKIE = "wc_session";
const SESSION_DAYS = 7;

export type SessionUser = Pick<UserRow, "id" | "email" | "name" | "company" | "role">;

export async function createSession(userId: string) {
  const token = randomToken();
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  run("DELETE FROM sessions WHERE expires_at < ?", Date.now());
  run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", sha256(token), userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
  store.delete(SESSION_COOKIE);
}

/** Utilisateur courant (dédupliqué par requête). */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = get<SessionUser>(
    `SELECT u.id, u.email, u.name, u.company, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`,
    sha256(token),
    Date.now()
  );
  return row ?? null;
});

/** À appeler dans chaque page / action privée. Redirige si le rôle ne convient pas. */
export async function requireUser(role?: "admin" | "client"): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/connexion");
  if (role && user.role !== role) redirect(user.role === "admin" ? "/admin" : "/client");
  return user;
}

/* ---------- Limitation de débit en mémoire (anti force brute) ---------- */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= max;
}
