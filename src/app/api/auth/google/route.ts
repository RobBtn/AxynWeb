import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GOOGLE_COOKIE, googleConfigured, startGoogleFlow } from "@/lib/google";

/** Démarre la connexion avec Google : mémorise state / PKCE / nonce, puis part chez Google. */
export async function GET() {
  if (!googleConfigured()) redirect("/connexion");
  const { flow, url } = startGoogleFlow();
  (await cookies()).set(GOOGLE_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  redirect(url);
}
