import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ParticleStage from "@/components/ParticleStage";
import LoginForm from "./LoginForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage() {
  const user = await getUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/client");

  return (
    <>
      {/* Même fond de particules que l'accueil : il couvre tout l'écran, quelle que soit sa taille. */}
      <ParticleStage />
      <section
        data-stage="4"
        data-stage-alpha="0.5"
        data-stage-bg="#f3f0e6"
        data-stage-ink="#164a36"
        className="flex min-h-dvh items-center justify-center px-6 py-32"
      >
        <div className="glass rise w-full max-w-md rounded-2xl p-8 shadow-[6px_6px_0_var(--color-bone)] md:p-10">
          <p className="kicker">Espace client</p>
          <h1 className="display mt-4 text-5xl">Content de vous revoir.</h1>
          <p className="mt-3 text-sm text-mute">Vos identifiants vous ont été remis à la livraison de votre site.</p>
          <LoginForm />
        </div>
      </section>
    </>
  );
}
