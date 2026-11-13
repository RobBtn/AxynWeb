import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stage3D from "@/components/Stage3D";
import LoginForm from "./LoginForm";
import { getUser } from "@/lib/auth";
import { signupAvailable } from "@/lib/mail";
import { googleConfigured } from "@/lib/google";

const googleErrors: Record<string, string> = {
  google: "La connexion avec Google a échoué. Réessayez.",
  annule: "Connexion avec Google annulée.",
  ferme: "Aucun compte n'est associé à cette adresse Google, et les inscriptions sont fermées.",
  tentatives: "Trop de tentatives. Réessayez dans 15 minutes.",
};

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const googleError = erreur ? googleErrors[erreur] : undefined;
  const user = await getUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/client");

  return (
    <>
      {/* Même fond 3D que l'accueil : il couvre tout l'écran, quelle que soit sa taille. */}
      <Stage3D />
      <section
        data-stage="0"
        data-stage-alpha="0.5"
        data-stage-bg="#f3f0e6"
        data-stage-ink="#164a36"
        className="flex min-h-dvh items-center justify-center px-6 py-32"
      >
        <div className="glass rise w-full max-w-md rounded-2xl p-8 shadow-[6px_6px_0_var(--color-bone)] md:p-10">
          <p className="kicker">Espace client</p>
          <h1 className="display mt-4 text-5xl">Content de vous revoir.</h1>
          <p className="mt-3 text-sm text-mute">Vos identifiants vous ont été remis à la livraison de votre site.</p>
          {googleConfigured() && (
            <>
              {/* Lien simple (pas de JavaScript) : la route /api/auth/google part chez Google. */}
              <a href="/api/auth/google" className="btn mt-8 flex w-full items-center justify-center gap-3 border border-bone">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
                  <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
                </svg>
                Continuer avec Google
              </a>
              {googleError && (
                <p role="alert" className="mt-3 text-sm text-coral">
                  {googleError}
                </p>
              )}
              <p className="mt-6 text-center text-xs uppercase tracking-widest text-mute">ou avec votre e-mail</p>
            </>
          )}
          <LoginForm />
          {signupAvailable() && (
            <p className="mt-4 text-sm text-mute">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="underline">
                Créer un compte
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
