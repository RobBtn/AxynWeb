"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "wc_cookie_notice";

/**
 * Bandeau d'information. Le site ne dépose que des cookies strictement
 * nécessaires (session de connexion) : ils sont exemptés de consentement
 * (lignes directrices CNIL), une simple information suffit. Si vous ajoutez
 * un jour une mesure d'audience ou un traceur tiers, il faudra un vrai
 * recueil de consentement (accepter / refuser) AVANT tout dépôt.
 */
export default function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {}
    if (seen) return;
    const t = window.setTimeout(() => setShow(true), 1800);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="glass rise fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl p-5 text-sm sm:flex-row sm:items-center"
    >
      <p className="text-bone/80">
        Zéro traceur, zéro publicité. Ce site utilise uniquement un cookie de connexion, indispensable à l&apos;espace
        client.{" "}
        <Link href="/confidentialite" className="underline">
          En savoir plus
        </Link>
      </p>
      <button
        className="btn btn-primary btn-sm shrink-0"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
          setShow(false);
        }}
      >
        Compris
      </button>
    </div>
  );
}
