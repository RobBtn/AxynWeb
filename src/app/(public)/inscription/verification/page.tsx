import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Stage3D from "@/components/Stage3D";
import VerifyForm from "./VerifyForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Vérifier mon e-mail", robots: { index: false } };

export default async function VerificationPage() {
  const user = await getUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/client");
  // L'adresse vient d'un cookie posé à l'étape 1 : sans lui, on repart du début.
  const email = (await cookies()).get("wc_signup")?.value;
  if (!email) redirect("/inscription");

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
          <p className="kicker">Dernière étape</p>
          <h1 className="display mt-4 text-5xl">Vérifiez votre e-mail.</h1>
          <VerifyForm email={email} />
        </div>
      </section>
    </>
  );
}
