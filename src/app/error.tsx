"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Filet de sécurité : si une page plante, le visiteur voit un message clair et peut réessayer. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="kicker">Un souci technique</p>
        <h1 className="display mt-5 text-5xl md:text-6xl">Cette page n&apos;a pas pu s&apos;afficher.</h1>
        <p className="mx-auto mt-4 max-w-md text-mute">Rien n&apos;est perdu. Réessayez, ou revenez à l&apos;accueil.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn btn-primary">
            Réessayer
          </button>
          <Link href="/" className="btn btn-ghost">
            Retour à l&apos;accueil
          </Link>
        </div>
        {error.digest && <p className="mt-6 font-mono text-xs text-mute">Référence : {error.digest}</p>}
      </div>
    </main>
  );
}
