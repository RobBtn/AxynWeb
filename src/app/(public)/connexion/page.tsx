import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Scene3D from "@/components/Scene3D";
import LoginForm from "./LoginForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage() {
  const user = await getUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/client");

  return (
    <>
      <Scene3D preset="silk" colors={["#e3dfd0", "#c9dcc0", "#ffffff"]} opacity={0.9} light />
      <section className="flex min-h-dvh items-center justify-center px-6 py-32">
        <div className="glass rise w-full max-w-md rounded-2xl p-8 md:p-10">
          <p className="kicker">Espace client</p>
          <h1 className="display mt-3 text-5xl">Content de vous revoir.</h1>
          <p className="mt-3 text-sm text-mute">Vos identifiants vous ont été remis à la livraison de votre site.</p>
          <LoginForm />
        </div>
      </section>
    </>
  );
}
