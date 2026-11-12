import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stage3D from "@/components/Stage3D";
import SignupForm from "./SignupForm";
import { getUser } from "@/lib/auth";
import { signupAvailable } from "@/lib/mail";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function InscriptionPage() {
  const user = await getUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/client");
  const open = signupAvailable();

  return (
    <>
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
          <h1 className="display mt-4 text-5xl">Créer un compte.</h1>
          {open ? (
            <>
              <p className="mt-3 text-sm text-mute">Nous vous envoyons un code à 6 chiffres pour vérifier votre adresse e-mail.</p>
              <SignupForm />
            </>
          ) : (
            <p className="mt-6 rounded-xl border border-bone p-4 text-sm">Les inscriptions sont fermées pour le moment.</p>
          )}
          <p className="mt-4 text-sm text-mute">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="underline">
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
