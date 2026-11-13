import Link from "next/link";

/** Page introuvable : on reste dans l'identité du site et on propose une sortie. */
export default function NotFound() {
  return (
    <main className="zone-accent grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="display text-[clamp(7rem,30vw,20rem)] leading-[0.8]">404</p>
        <h1 className="display mt-6 text-4xl md:text-5xl">Cette page n&apos;existe pas.</h1>
        <p className="mx-auto mt-4 max-w-md text-mute">
          Le lien est peut-être ancien, ou l&apos;adresse a été mal saisie.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Retour à l&apos;accueil
          </Link>
          <Link href="/exemples" className="btn btn-ghost">
            Voir des exemples
          </Link>
        </div>
      </div>
    </main>
  );
}
