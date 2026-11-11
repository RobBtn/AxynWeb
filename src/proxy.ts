import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "wc_session";

/**
 * Proxy (ex-middleware) :
 * 1. pose une Content-Security-Policy stricte avec nonce par requête ;
 * 2. redirige vers /connexion si aucun cookie de session n'est présent sur
 *    les espaces privés. Ce n'est qu'un contrôle optimiste : la vraie
 *    vérification (session + rôle) est refaite côté serveur dans chaque page
 *    et chaque Server Action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    (pathname.startsWith("/client") || pathname.startsWith("/admin")) &&
    !request.cookies.get(SESSION_COOKIE)
  ) {
    const url = new URL("/connexion", request.url);
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Les animations (GSAP, styles en ligne React) imposent 'unsafe-inline' pour les styles.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
