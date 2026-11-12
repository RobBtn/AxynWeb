import type { Metadata } from "next";

// Sur le domaine d'un client, rien ne doit rappeler la plateforme, pas même le titre de l'onglet.
export const metadata: Metadata = {
  title: { absolute: "Site indisponible" },
  robots: { index: false },
  icons: { icon: [], shortcut: [], apple: [] },
};

/** Page affichée sur un domaine qui n'a (pas encore) de site en ligne. */
export default function DomainNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-white p-8 text-center text-neutral-800">
      <div>
        <h1 className="text-3xl font-semibold">Site indisponible</h1>
        <p className="mt-3 text-neutral-500">Ce site n&apos;est pas encore en ligne. Merci de revenir un peu plus tard.</p>
      </div>
    </main>
  );
}
