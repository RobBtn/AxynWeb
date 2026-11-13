import "server-only";
import { createHash } from "node:crypto";
import { randomToken } from "./password";
import { siteUrl } from "./seo";

/**
 * Connexion avec Google (OpenID Connect, flux « code » avec PKCE).
 * Réglages : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET. Sans eux, le bouton n'apparaît pas.
 *
 * Le jeton d'identité est reçu directement de Google, par une requête HTTPS faite par le
 * serveur : la norme OpenID Connect (§3.1.3.7) admet alors de ne pas revérifier sa signature.
 * On contrôle en revanche l'émetteur, le destinataire, l'expiration, le nonce et l'e-mail vérifié.
 */
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

export const googleConfigured = () => Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
export const GOOGLE_COOKIE = "wc_google";
export const googleRedirectUri = () => `${siteUrl}/api/auth/google/callback`;

export type GoogleFlow = { state: string; verifier: string; nonce: string };

export function startGoogleFlow(): { flow: GoogleFlow; url: string } {
  const flow: GoogleFlow = { state: randomToken(), verifier: randomToken(48), nonce: randomToken() };
  const challenge = createHash("sha256").update(flow.verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return { flow, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
}

export type GoogleProfile = { sub: string; email: string; name: string };

/** Échange le code contre l'identité de l'utilisateur. Renvoie null si quoi que ce soit cloche. */
export async function finishGoogleFlow(code: string, flow: GoogleFlow): Promise<GoogleProfile | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID ?? "",
      client_secret: GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: flow.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return null;
  const { id_token } = (await res.json()) as { id_token?: string };
  const payload = id_token?.split(".")[1];
  if (!payload) return null;

  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const valid =
    (claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com") &&
    claims.aud === GOOGLE_CLIENT_ID &&
    typeof claims.exp === "number" &&
    claims.exp * 1000 > Date.now() &&
    claims.nonce === flow.nonce &&
    claims.email_verified === true &&
    typeof claims.sub === "string" &&
    typeof claims.email === "string";
  if (!valid) return null;

  return {
    sub: claims.sub as string,
    email: (claims.email as string).toLowerCase(),
    name: typeof claims.name === "string" ? claims.name : "",
  };
}
