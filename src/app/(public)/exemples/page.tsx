import type { Metadata } from "next";
import Link from "next/link";
import Scene3D from "@/components/Scene3D";
import TemplateCard from "@/components/TemplateCard";
import { templates } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Exemples de sites internet",
  description: "Exemples de sites vitrines avec fond 3D animé : restaurant, artisan, coach, boutique. Chaque site client est ensuite créé sur mesure.",
  alternates: { canonical: "/exemples" },
};

export default function ExemplesPage() {
  return (
    <>
      <Scene3D preset="grid" colors={["#c9c5b4", "#8d8a78", "#164a36"]} opacity={0.6} light />
      <section className="px-6 pb-16 pt-44 md:px-10">
        <p className="kicker rise">Exemples</p>
        <h1 className="display rise rise-1 mt-6 max-w-4xl text-[clamp(3rem,9vw,8rem)]">
          De quoi vous <em>inspirer</em>.
        </h1>
        <p className="rise rise-2 mt-8 max-w-xl text-lg text-bone/70">
          Quatre exemples de ce qu&apos;on crée : ouvrez-les et faites défiler. Votre site ne sera pas une copie : il est
          conçu de zéro, avec vos textes, vos photos, vos couleurs et un fond 3D à votre image.
        </p>
      </section>

      <section className="px-6 pb-32 md:px-10">
        <div data-stagger className="grid gap-x-6 gap-y-14 md:grid-cols-2">
          {templates.map((t) => (
            <TemplateCard key={t.id} t={t} className="h-[36rem]" />
          ))}
        </div>
        <div data-reveal className="glass mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl p-10 md:flex-row md:items-center">
          <div>
            <h2 className="display text-4xl">Une autre idée en tête ?</h2>
            <p className="mt-2 text-bone/70">Décrivez votre projet : chaque site est unique, même la première formule.</p>
          </div>
          <Link href="/#contact" className="btn btn-primary" data-magnetic>
            Décrire mon projet
          </Link>
        </div>
      </section>
    </>
  );
}
