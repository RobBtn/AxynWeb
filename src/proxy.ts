import { NextRequest, NextResponse } from "next/server";
import { classifyHost } from "@/lib/hosts";

const SESSION_COOKIE = "wc_session";

// HSTS : « includeSubDomains » seulement sur la plateforme. Sur le domaine d'un client, il forcerait
// le HTTPS sur tous ses autres sous-domaines (messagerie, intranet…), qui ne nous appartiennent pas.
const HSTS_PLATFORM = "max-age=63072000; includeSubDomains; preload";
const HSTS_CUSTOM = "max-age=31536000";

/** Sur le domaine d'un client, rien d'autre que ces chemins n'est accessible. */
const CUSTOM_ALLOWED_PREFIXES = ["/api/media/", "/api/raw/"];

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  return [
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
}

/**
 * Marque posée sur une requête que le proxy vient de réécrire vers /d/<domaine>. En production, Next fait repasser
 * la requête réécrite dans le proxy, avec un en-tête Host remplacé par celui du serveur (localhost) : ce secret
 * (propre à ce processus, impossible à deviner de l'extérieur) permet de la reconnaître et de la laisser passer,
 * sans jamais ouvrir /d/… à un visiteur. Le domaine d'origine voyage dans x-axynweb-host.
 */
const REWRITE_MARK = crypto.randomUUID();
const REWRITE_MARK_HEADER = "x-axynweb-rewrite";
const ORIGIN_HOST_HEADER = "x-axynweb-host"; // lu par src/app/d/[host]/page.tsx

/** Transmet la requête (éventuellement réécrite) avec une CSP à nonce, et la pose aussi sur la réponse. */
function withCsp(request: NextRequest, hsts: string, rewrite?: { to: URL; host: string }) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  if (rewrite) {
    requestHeaders.set(REWRITE_MARK_HEADER, REWRITE_MARK);
    requestHeaders.set(ORIGIN_HOST_HEADER, rewrite.host);
  }

  const init = { request: { headers: requestHeaders } };
  const response = rewrite ? NextResponse.rewrite(rewrite.to, init) : NextResponse.next(init);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Strict-Transport-Security", hsts);
  return response;
}

const plain = (status: number, body: string) =>
  new NextResponse(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Strict-Transport-Security": HSTS_CUSTOM } });

/**
 * Visite sur le nom de domaine d'un client : on ne montre que son site (page d'accueil), ses photos et son
 * cadre HTML. Ni l'administration, ni la connexion, ni les API de la plateforme ne sont joignables ici.
 */
function customDomain(request: NextRequest, host: string) {
  const { pathname } = request.nextUrl;
  if (request.method !== "GET" && request.method !== "HEAD") return plain(405, "Méthode non autorisée");

  if (CUSTOM_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    response.headers.set("Strict-Transport-Security", HSTS_CUSTOM);
    return response;
  }
  if (pathname !== "/") return plain(404, "Introuvable");
  return withCsp(request, HSTS_CUSTOM, { to: new URL(`/d/${host}`, request.url), host });
}

/**
 * Proxy (ex-middleware) :
 * 1. sépare la plateforme des domaines de clients (voir customDomain) ;
 * 2. pose une Content-Security-Policy stricte avec nonce par requête ;
 * 3. redirige vers /connexion si aucun cookie de session n'est présent sur
 *    les espaces privés. Ce n'est qu'un contrôle optimiste : la vraie
 *    vérification (session + rôle) est refaite côté serveur dans chaque page
 *    et chaque Server Action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Requête que nous venons de réécrire vers /d/<domaine> : sa CSP est déjà posée, on la laisse passer.
  if (pathname.startsWith("/d/") && request.headers.get(REWRITE_MARK_HEADER) === REWRITE_MARK) {
    const response = NextResponse.next();
    response.headers.set("Strict-Transport-Security", HSTS_CUSTOM);
    return response;
  }

  const host = classifyHost(request.headers.get("host"));
  if (host.kind === "invalid") return plain(400, "Nom d'hôte invalide");
  if (host.kind === "custom") return customDomain(request, host.host);

  // La vue par domaine n'existe que pour le proxy : pas d'accès direct par l'adresse de la plateforme.
  if (pathname === "/d" || pathname.startsWith("/d/")) return plain(404, "Introuvable");

  if (pathname.startsWith("/api")) {
    const response = NextResponse.next();
    response.headers.set("Strict-Transport-Security", HSTS_PLATFORM);
    return response;
  }

  if ((pathname.startsWith("/client") || pathname.startsWith("/admin")) && !request.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  return withCsp(request, HSTS_PLATFORM);
}

export const config = {
  matcher: [
    {
      // Tout sauf les fichiers statiques de Next : les API et le favicon passent aussi par ici, pour
      // que les domaines de clients n'y accèdent qu'aux chemins autorisés.
      source: "/((?!_next/static|_next/image).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
