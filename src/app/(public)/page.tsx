import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Stage3D from "@/components/Stage3D";
import Estimator from "@/components/Estimator";
import TemplateCard from "@/components/TemplateCard";
import { pricing } from "@/lib/config";
import { metiers } from "@/lib/metiers";
import { area, faqLd, openGraph, organizationLd, websiteLd } from "@/lib/seo";
import { templates } from "@/lib/templates";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: openGraph("/") };

const sectors = ["Restaurants", "Artisans", "Coachs", "Créateurs", "Architectes", "Boutiques", "Thérapeutes", "Associations"];

const steps = [
  { n: "01", title: "Le brief", text: "Vous décrivez votre activité en quelques lignes, ou vous choisissez un modèle. C'est tout ce qu'il nous faut." },
  { n: "02", title: "La création", text: "Nous montons une première version complète : structure, textes, fond 3D, animations." },
  { n: "03", title: "Les retouches", text: "Chaque page est relue, corrigée et vérifiée côté sécurité. Vous ajoutez vos photos et validez depuis votre espace client." },
  { n: "04", title: "La mise en ligne", text: "Nom de domaine, hébergement en Europe, certificat HTTPS. Votre site est en ligne." },
];

const clientFeatures = [
  { title: "Vos textes et vos photos, en direct", text: "Un horaire qui change, une nouvelle photo : vous la déposez, c'est en ligne tout de suite." },
  { title: "Une modification ? Demandez", text: "Décrivez ce que vous voulez, suivez l'avancement et échangez avec nous au même endroit." },
  { title: "Votre domaine sous surveillance", text: "Date d'expiration, renouvellement automatique : plus jamais de site qui disparaît par oubli." },
  { title: "Vos données vous appartiennent", text: "Export en un clic, suppression sur demande, aucun traceur. Conforme au RGPD." },
];

const security = [
  { title: "Code relu avant la mise en ligne", text: "Chaque site est vérifié : formulaires, accès, dépendances. Rien ne part sans contrôle." },
  { title: "HTTPS partout", text: "Certificat inclus et renouvelé automatiquement. Vos visiteurs voient le cadenas." },
  { title: "Mises à jour suivies", text: "Les correctifs de sécurité sont appliqués pour vous, sans rien casser." },
  { title: "Sauvegardes régulières", text: "Votre site et vos contenus peuvent être restaurés en cas de problème." },
  { title: "Hébergement en Europe", text: "Vos données et celles de vos visiteurs restent dans l'Union européenne." },
  { title: "Zéro traceur par défaut", text: "Pas de publicité, pas de pistage. Conforme au RGPD sans bandeau envahissant." },
];

const faq = [
  {
    q: "Qui est derrière le studio ?",
    a: "Le studio est porté par un étudiant ingénieur en cybersécurité, en cours de cursus. Nous travaillons avec des outils modernes, dont l'assistance par IA, et nous connaissons les failles qu'ils peuvent introduire dans le code : chaque site est relu, sécurisé avant la mise en ligne, puis tenu à jour.",
  },
  {
    q: `Combien coûte la création d'un site internet ?`,
    a: `Un site une page basé sur un modèle 3D coûte ${pricing.offers[0].price} €, un site jusqu'à 5 pages ${pricing.offers[1].price} €, un site sur-mesure à partir de ${pricing.offers[2].price} €. S'y ajoutent ${pricing.maintenanceMonthly} € par mois pour l'hébergement, la sécurité et l'espace client, sans engagement. Le simulateur ci-dessous donne un prix précis.`,
  },
  {
    q: `Travaillez-vous seulement à ${area.mainCity} ?`,
    a: `Non. Le studio est basé au Rheu, près de ${area.mainCity}, et crée des sites pour toute la France : tout se fait à distance depuis l'espace client.`,
  },
  {
    q: "Le site m'appartient-il ?",
    a: "Oui. Le nom de domaine est enregistré à votre nom et vous pouvez récupérer votre contenu à tout moment.",
  },
  {
    q: "Le fond 3D ralentit-il le site ?",
    a: "Non. Il se charge après le contenu, s'adapte à la puissance de l'appareil et se met en pause quand il n'est pas visible. Il est désactivé pour les visiteurs qui ont demandé moins d'animations.",
  },
  {
    q: "Que comprend la maintenance ?",
    a: `Pour ${pricing.maintenanceMonthly} € par mois : hébergement en Europe, certificat HTTPS, sauvegardes, mises à jour de sécurité et accès à votre espace client.`,
  },
  {
    q: "Et si je veux arrêter ?",
    a: "Vous arrêtez quand vous voulez. Nous vous remettons votre contenu et transférons votre nom de domaine.",
  },
];

const facts = [
  { big: "72 h", label: "pour une première version en ligne" },
  { big: `${pricing.offers[0].price} €`, label: "le site complet, à partir de" },
  { big: "100 %", label: "des sites relus, sécurisés et tenus à jour" },
];

/**
 * Carte d'offre du héros : prix d'appel, délai et accès direct au devis. Fixe et lisible ;
 * sur téléphone elle est masquée, le texte d'introduction reprend déjà le prix et le délai.
 */
function OfferCard() {
  return (
    <Link
      href="/#contact"
      className="group flex w-64 flex-col gap-5 rounded-2xl border border-bone bg-ink-2/80 p-5 shadow-[5px_5px_0_var(--color-bone)] backdrop-blur-md transition-transform hover:-translate-y-1"
    >
      <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
        Devis instantané
      </span>
      <span className="flex items-end justify-between gap-4">
        <span>
          <span className="block text-sm text-mute">Site complet dès</span>
          <span className="display text-5xl">{pricing.offers[0].price} €</span>
        </span>
        <span
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-xl text-on-accent transition-transform duration-300 group-hover:rotate-45"
          aria-hidden="true"
        >
          ↗
        </span>
      </span>
      <span className="border-t border-line pt-4 text-sm">En ligne en 72 h · Sécurité incluse</span>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd items={[organizationLd(), websiteLd(), faqLd(faq)]} />
      <Stage3D />

      {/* HÉROS */}
      <section data-stage="0" data-stage-alpha="0.85" data-stage-bg="#f3f0e6" data-stage-ink="#164a36" className="relative flex min-h-dvh flex-col justify-end px-6 pb-10 pt-32 md:px-10">
        <div className="rise absolute right-16 top-40 hidden md:block">
          <OfferCard />
        </div>

        <h1 className="kicker rise self-start">Création de site internet à {area.mainCity}</h1>
        <p className="display mt-8 text-[clamp(3.2rem,11.5vw,13rem)]">
          <span className="line-mask">
            <span>Votre site pro</span>
          </span>
          <span className="line-mask">
            <span>
              en 72 h, <em>dès {pricing.offers[0].price} €.</em>
            </span>
          </span>
        </p>

        <div className="rise rise-3 mt-10 flex flex-col gap-8 border-t border-bone pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg">
            Rapide, pas cher, et pourtant pas au rabais : un design qui marque, des textes qui donnent envie, bien placé
            sur Google et sécurisé. Vous modifiez tout vous-même depuis votre espace client.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/modeles" className="btn btn-primary" data-magnetic>
              Voir les modèles <span aria-hidden="true">→</span>
            </Link>
            <Link href="/#contact" className="btn btn-ghost" data-magnetic>
              Estimer mon site
            </Link>
          </div>
        </div>
      </section>

      {/* BANDEAU */}
      <div className="zone-dark -rotate-1 scale-x-105 overflow-hidden py-5" aria-hidden="true">
        <div className="marquee-track">
          {[...sectors, ...sectors].map((s, i) => (
            <span key={i} className="display mx-6 text-3xl md:text-5xl">
              {s} <span className="ml-10 text-accent">✺</span>
            </span>
          ))}
        </div>
      </div>

      {/* MANIFESTE — aplat vert, le texte s'allume au défilement */}
      <section data-stage="1" data-stage-alpha="0.6" data-stage-bg="#164a36" data-stage-ink="#cfe3c4" className="zone-accent relative z-10 -mt-4 px-6 py-40 md:px-10">
        <p className="kicker" data-reveal>
          Notre parti pris
        </p>
        <p data-scrub-text className="display mt-10 max-w-6xl text-[clamp(2rem,5.4vw,5.4rem)] leading-[1]">
          Un site qu&apos;on oublie, c&apos;est un client qui part chez le voisin. Le vôtre doit arrêter le pouce qui
          défile, donner envie d&apos;appeler, et tenir bon face aux attaques : chaque site est relu et sécurisé par un
          étudiant ingénieur en cybersécurité.
        </p>
        <dl data-stagger className="mt-24 grid gap-4 md:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-2xl border border-bone bg-ink-2 p-8">
              <dd className="display text-7xl md:text-8xl">{f.big}</dd>
              <dt className="mt-3">{f.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* MODÈLES — défilement horizontal épinglé, sur fond sombre */}
      <section id="modeles" data-hscroll data-stage="2" data-stage-alpha="0.55" data-stage-bg="#10130b" data-stage-ink="#cfe3c4" className="zone-dark relative z-10 overflow-hidden">
        {/* GSAP épingle ce bloc interne, jamais la section : React doit retrouver ses nœuds au changement de page. */}
        <div data-hscroll-pin>
        <div
          data-hscroll-track
          className="flex gap-6 overflow-x-auto px-6 py-12 md:h-dvh md:items-center md:gap-10 md:overflow-visible md:px-10"
        >
          <div className="w-[80vw] shrink-0 md:w-[30vw]">
            <p className="kicker">Modèles</p>
            <h2 className="display mt-6 text-5xl md:text-7xl">
              Quatre univers. <em>Le vôtre</em> en fait partie.
            </h2>
            <p className="mt-6 max-w-sm text-bone/75">
              Chaque modèle est un vrai site : fond 3D, cadres pour vos photos, infos pratiques. Ouvrez-les et faites
              défiler.
            </p>
            <Link href="/modeles" className="btn btn-primary mt-8">
              Toute la galerie →
            </Link>
          </div>
          {templates.map((t) => (
            <div key={t.id} data-depth className="shrink-0"><TemplateCard t={t} className="h-[68vh] w-[84vw] md:w-[46vw]" /></div>
          ))}
        </div>
        </div>
      </section>

      {/* MÉTHODE — cartes qui s'empilent */}
      <section id="methode" data-stage="3" data-stage-alpha="0.55" data-stage-bg="#f3f0e6" data-stage-ink="#164a36" className="relative z-10 scroll-mt-24 bg-ink px-6 py-40 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="kicker" data-reveal>
              Méthode
            </p>
            <h2 data-split className="display mt-6 text-5xl md:text-7xl">
              Trois jours entre votre idée et votre site.
            </h2>
          </div>
          <ol>
            {steps.map((s, i) => (
              <li
                key={s.n}
                className={`sticky mb-6 rounded-2xl border border-bone p-8 shadow-[6px_6px_0_var(--color-bone)] md:p-12 ${
                  i === 1 ? "zone-accent" : i === 3 ? "zone-dark" : "bg-ink-2"
                }`}
                style={{ top: `calc(6.5rem + ${i * 1.25}rem)` }}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="display text-4xl md:text-6xl">{s.title}</h3>
                  <span className="font-mono text-xs">{s.n} / 04</span>
                </div>
                <p className="mt-16 max-w-lg text-lg md:mt-28">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ESPACE CLIENT */}
      <section data-stage="4" data-stage-alpha="0.46" data-stage-bg="#fffdf6" data-stage-ink="#164a36" className="relative z-10 border-t border-bone bg-ink-2 px-6 py-40 md:px-10">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <div>
            <p className="kicker" data-reveal>
              Espace client
            </p>
            <h2 data-split className="display mt-6 text-5xl md:text-7xl">
              Votre site ne vous échappe plus.
            </h2>
            <ul data-stagger className="mt-14 border-t border-bone">
              {clientFeatures.map((f, i) => (
                <li key={f.title} className="grid gap-2 border-b border-line py-7 md:grid-cols-[3rem_1fr]">
                  <span className="font-mono text-xs text-mute">0{i + 1}</span>
                  <div>
                    <h3 className="text-xl font-medium">{f.title}</h3>
                    <p className="mt-2 text-mute">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Maquette illustrative de l'espace client */}
          <div
            data-parallax="0.3"
            className="rotate-1 rounded-2xl border border-bone bg-ink p-5 shadow-[8px_8px_0_var(--color-accent)] lg:mt-24"
            aria-hidden="true"
          >
            <div className="flex items-center justify-between border-b border-line pb-4 text-sm">
              <span className="font-medium">Mon site — Maison Aurore</span>
              <span className="pill pill-ok">en ligne</span>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_1.1fr] gap-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-ink-2 p-4">
                  <p className="text-xs text-mute">Grand titre</p>
                  <p className="mt-1 text-lg">La cuisine du feu et du temps</p>
                </div>
                <div className="rounded-xl border border-line bg-ink-2 p-4">
                  <p className="text-xs text-mute">Horaires</p>
                  <p className="mt-1 text-sm">Mardi – samedi, midi et soir</p>
                </div>
                <span className="btn btn-primary btn-sm w-full">Enregistrer</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["La salle", "Le chef", "Le feu", "+ Photo"].map((p, i) => (
                  <div
                    key={p}
                    className={`flex aspect-square items-end rounded-xl p-3 text-xs ${
                      i === 3 ? "border border-dashed border-bone" : "bg-ink-3"
                    }`}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-ink-2 p-4 text-sm">
              <span>Ajouter les horaires d&apos;été</span>
              <span className="pill pill-info">en cours</span>
            </div>
          </div>
        </div>
      </section>

      {/* SÉCURITÉ */}
      <section data-stage="5" data-stage-alpha="0.45" data-stage-bg="#10130b" data-stage-ink="#cfe3c4" className="zone-dark relative z-10 px-6 py-40 md:px-10">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="kicker" data-reveal>
              Sécurité
            </p>
            <h2 data-split className="display mt-6 text-5xl md:text-7xl">
              Un site sûr, pas seulement joli.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-lg text-bone/75">
              La sécurité n&apos;est pas une option facturée en plus : elle est incluse dans chaque site, dès le premier
              jour.
            </p>
          </div>
          <ul data-stagger className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {security.map((s, i) => (
              <li key={s.title} className="bg-ink p-7">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <h3 className="mt-6 text-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-mute">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* MÉTIERS — maillage vers les pages par activité */}
      <section data-stage="3" data-stage-alpha="0.5" data-stage-bg="#fffdf6" data-stage-ink="#164a36" className="relative z-10 border-t border-bone bg-ink-2 px-6 py-32 md:px-10">
        <p className="kicker" data-reveal>
          Par métier
        </p>
        <h2 data-split className="display mt-6 max-w-4xl text-5xl md:text-7xl">
          Votre métier a ses codes. Votre site aussi.
        </h2>
        <ul data-stagger className="mt-14 flex flex-wrap gap-3">
          {metiers.map((m) => (
            <li key={m.slug}>
              <Link href={`/creation-site-internet/${m.slug}`} className="btn btn-ghost">
                Site internet pour {m.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/creation-site-internet" className="mt-8 inline-block underline underline-offset-4">
          Création de site internet à {area.mainCity} : notre approche →
        </Link>
      </section>

      {/* TARIFS */}
      <section id="tarifs" data-stage="0" data-stage-alpha="0.5" data-stage-bg="#f3f0e6" data-stage-ink="#164a36" className="relative z-10 scroll-mt-24 border-t border-bone bg-ink px-6 py-40 md:px-10">
        <p className="kicker" data-reveal>
          Tarifs
        </p>
        <h2 data-split className="display mt-6 max-w-4xl text-5xl md:text-8xl">
          Le prix d&apos;un artisan. Le rendu d&apos;une agence.
        </h2>
        <div data-stagger className="mt-20 grid gap-5 lg:grid-cols-3">
          {pricing.offers.map((o) => (
            <article
              key={o.id}
              data-tilt className={`flex flex-col rounded-2xl border border-bone p-8 ${o.featured ? "zone-accent" : "bg-ink-2"}`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{o.name}</h3>
                {o.featured && <span className="rounded-full bg-bone px-3 py-1 text-xs text-ink">Le plus choisi</span>}
              </div>
              <p className="display mt-10 text-7xl md:text-8xl">
                {o.from && <span className="mr-2 align-middle font-sans text-base font-normal tracking-normal">dès</span>}
                {o.price.toLocaleString("fr-FR")} €
              </p>
              <p className="mt-4">{o.description}</p>
              <ul className="mt-8 flex-1 border-t border-bone text-sm">
                {o.features.map((f) => (
                  <li key={f} className="border-b border-line py-3">
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/#contact" className={`btn mt-10 ${o.featured ? "btn-dark" : "btn-ghost"}`}>
                Choisir {o.name}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-mute">
          + {pricing.maintenanceMonthly} €/mois : hébergement en Europe, HTTPS, sauvegardes, espace client. Sans engagement.
        </p>
      </section>

      {/* FAQ */}
      <section data-stage="0" data-stage-alpha="0.4" data-stage-bg="#fffdf6" data-stage-ink="#164a36" className="relative z-10 border-t border-bone bg-ink-2 px-6 py-32 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <h2 data-split className="display text-5xl md:text-6xl">
            Questions fréquentes
          </h2>
          <div data-stagger className="border-t border-bone">
            {faq.map((f) => (
              <details key={f.q} className="group border-b border-line py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-xl font-medium">
                  {f.q}
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-bone text-xl transition-all duration-300 group-open:rotate-45 group-open:bg-accent"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl text-mute">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / SIMULATEUR */}
      <section id="contact" data-stage="4" data-stage-alpha="0.46" data-stage-bg="#f3f0e6" data-stage-ink="#164a36" className="relative z-10 scroll-mt-24 border-t border-bone bg-ink px-6 py-40 md:px-10">
        <p className="kicker" data-reveal>
          Devis instantané
        </p>
        <h2 data-reveal className="display mt-6 max-w-5xl text-5xl md:text-8xl">
          Votre prix, <em>en 30 secondes.</em>
        </h2>
        <div data-reveal className="mt-16">
          <Estimator />
        </div>
      </section>
    </>
  );
}
