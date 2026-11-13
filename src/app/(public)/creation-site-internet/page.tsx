import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { brand, pricing } from "@/lib/config";
import { metiers } from "@/lib/metiers";
import { area, breadcrumbLd, faqLd, openGraph, serviceLd } from "@/lib/seo";

const path = "/creation-site-internet";
const description = `Création de site internet à ${area.mainCity} pour indépendants, commerces et TPE : site vitrine moderne et sécurisé, en ligne en 72 h dès ${pricing.offers[0].price} €, modifiable depuis votre espace client.`;

export const metadata: Metadata = {
  title: `Création de site internet à ${area.mainCity} et en ${area.region}`,
  description,
  alternates: { canonical: path },
  openGraph: openGraph(path, { description }),
};

const faq = [
  {
    q: `Faut-il être à ${area.mainCity} pour travailler avec ${brand.name} ?`,
    a: `Non. Le studio est basé au Rheu, à côté de ${area.mainCity}, en ${area.department}. Tout peut se faire à distance, partout en France : brief, validation et retouches passent par l'espace client.`,
  },
  {
    q: "Combien de temps faut-il pour créer un site vitrine ?",
    a: "Une première version complète est en ligne en 72 h après le brief. Les retouches se font ensuite depuis l'espace client, à votre rythme.",
  },
  {
    q: "Le référencement est-il inclus ?",
    a: `Chaque site part sur de bonnes bases : titres et descriptions, chargement rapide, affichage mobile. La formule Signature inclut le référencement de base, et l'option référencement du simulateur coûte ${pricing.simulator.options.find((o) => o.id === "seo")?.price ?? 60} €.`,
  },
  {
    q: "Quelle différence avec un site fait sur Wix ou WordPress ?",
    a: "Vous n'avez rien à monter vous-même : le site est créé, relu côté sécurité, hébergé en Europe et tenu à jour pour vous. Vous gardez la main sur vos textes et vos photos depuis l'espace client, sans extension à mettre à jour.",
  },
];

const steps = [
  ["Le brief", "Quelques lignes sur votre activité, et un exemple qui vous plaît."],
  ["La création", "Structure, textes, fond 3D et animations : une première version complète."],
  ["Les retouches", "Relecture, vérification de sécurité, ajout de vos photos depuis l'espace client."],
  ["La mise en ligne", "Nom de domaine, hébergement en Europe et HTTPS : votre site est en ligne."],
];

export default function CreationSiteInternet() {
  return (
    <>
      <JsonLd
        items={[
          serviceLd(`Création de site internet à ${area.mainCity}`, description, path, "Indépendants, commerces et TPE"),
          faqLd(faq),
          breadcrumbLd([["Création de site internet", path]]),
        ]}
      />

      <section className="px-6 pb-16 pt-44 md:px-10">
        <p className="kicker rise">
          {area.mainCity} · {area.department} · {area.region}
        </p>
        <h1 className="display rise rise-1 mt-6 max-w-5xl text-[clamp(2.6rem,7.5vw,7rem)]">
          Création de site internet <em>à {area.mainCity}</em>
        </h1>
        <p className="rise rise-2 mt-8 max-w-2xl text-lg">
          {brand.name} crée des sites vitrines modernes pour les indépendants, commerces et TPE de {area.mainCity}, de{" "}
          Le Rheu et de toute la {area.region}, et partout en France à distance. Un fond 3D qui marque les esprits, une
          sécurité vérifiée par un étudiant ingénieur en cybersécurité, et un espace client pour tout modifier vous-même.
        </p>
        <div className="rise rise-3 mt-10 flex flex-wrap gap-3">
          <Link href="/#contact" className="btn btn-primary" data-magnetic>
            Estimer mon site <span aria-hidden="true">→</span>
          </Link>
          <Link href="/exemples" className="btn btn-ghost">
            Voir des exemples
          </Link>
        </div>
      </section>

      <section className="border-t border-bone bg-ink-2 px-6 py-24 md:px-10">
        <h2 data-reveal className="display max-w-4xl text-4xl md:text-6xl">
          Un site pour votre métier
        </h2>
        <p className="mt-6 max-w-2xl text-mute">
          Chaque activité a ses questions : la carte d&apos;un restaurant, la zone d&apos;intervention d&apos;un artisan, le
          planning d&apos;un coach. Choisissez la vôtre.
        </p>
        <ul data-stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {metiers.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/creation-site-internet/${m.slug}`}
                className="flex h-full flex-col rounded-2xl border border-bone bg-ink p-8 transition-transform hover:-translate-y-1"
              >
                <h3 className="text-xl font-medium">Site internet pour {m.name}</h3>
                <p className="mt-3 flex-1 text-mute">{m.intro.split(". ")[0]}.</p>
                <span className="mt-6 text-sm">Découvrir →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-6 py-24 md:px-10">
        <h2 data-reveal className="display text-4xl md:text-6xl">
          Du brief au site en ligne
        </h2>
        <ol data-stagger className="mt-14 grid gap-5 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-bone bg-ink-2 p-8">
              <span className="font-mono text-xs">0{i + 1}</span>
              <h3 className="mt-6 text-xl font-medium">{t}</h3>
              <p className="mt-2 text-mute">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-bone bg-ink-2 px-6 py-24 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <h2 data-reveal className="display text-4xl md:text-6xl">
            Questions fréquentes
          </h2>
          <div className="border-t border-bone">
            {faq.map((f) => (
              <details key={f.q} className="group border-b border-line py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-xl font-medium">
                  <h3>{f.q}</h3>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-bone text-xl transition-all duration-300 group-open:rotate-45 group-open:bg-accent" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-mute">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
