import Link from "next/link";
import ParticleStage from "@/components/ParticleStage";
import Estimator from "@/components/Estimator";
import TemplateCard from "@/components/TemplateCard";
import { pricing } from "@/lib/config";
import { templates } from "@/lib/templates";

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

const faq = [
  {
    q: "Qui est derrière le studio ?",
    a: "Le studio est porté par un étudiant ingénieur en cybersécurité, en cours de cursus. Nous travaillons avec des outils modernes, dont l'assistance par IA, et nous connaissons les failles qu'ils peuvent introduire dans le code : chaque site est relu, sécurisé avant la mise en ligne, puis tenu à jour.",
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

/** Pastille ronde dont le texte tourne : signature visuelle du héros. */
function Sticker() {
  const text = `Dès ${pricing.offers[0].price} € · En ligne en 72 h · Sites sécurisés · `;
  return (
    <Link
      href="/#contact"
      aria-label="Estimer mon site"
      className="group relative grid size-36 place-items-center rounded-full border border-bone bg-accent text-on-accent shadow-[5px_5px_0_var(--color-bone)] transition-transform hover:scale-105 max-md:size-28 md:size-44"
    >
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id="sticker-ring" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0" />
        </defs>
        <text className="font-mono" fontSize="13.5" letterSpacing="1.5" fill="currentColor">
          <textPath href="#sticker-ring">{(text + text).toUpperCase().slice(0, 62)}</textPath>
        </text>
      </svg>
      <span className="display text-4xl transition-transform duration-300 group-hover:rotate-45" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <ParticleStage />

      {/* HÉROS */}
      <section data-stage="0" data-stage-alpha="0.66" data-stage-bg="#f3f0e6" data-stage-ink="#12150d" className="relative flex min-h-dvh flex-col justify-end px-6 pb-10 pt-32 md:px-10">
        <div className="rise absolute right-5 top-24 md:right-16 md:top-40">
          <Sticker />
        </div>

        <p className="kicker rise self-start">Studio web · Sécurité d&apos;abord</p>
        <h1 className="display mt-8 text-[clamp(3.2rem,11.5vw,13rem)]">
          <span className="line-mask">
            <span>Des sites qui</span>
          </span>
          <span className="line-mask">
            <span>
              coupent <em>le souffle.</em>
            </span>
          </span>
        </h1>

        <div className="rise rise-3 mt-10 flex flex-col gap-8 border-t border-bone pt-8 md:flex-row md:items-end md:justify-between">
          <p className="max-w-md text-lg">
            Un fond 3D qui vit, des animations qui sortent du défilement ordinaire, et un espace client pour tout gérer
            vous-même.
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
          Un beau site livré vite, c&apos;est bien. Un site sûr, c&apos;est indispensable. Le studio est porté par un
          étudiant ingénieur en cybersécurité : chaque site est relu, sécurisé et tenu à jour, et vous êtes accompagné du
          premier échange à la mise en ligne.
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
              Du brief au site en ligne, en quatre temps.
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

      {/* TARIFS */}
      <section id="tarifs" data-stage="5" data-stage-alpha="0.46" data-stage-bg="#f3f0e6" data-stage-ink="#12150d" className="relative z-10 scroll-mt-24 border-t border-bone bg-ink px-6 py-40 md:px-10">
        <p className="kicker" data-reveal>
          Tarifs
        </p>
        <h2 data-split className="display mt-6 max-w-4xl text-5xl md:text-8xl">
          Des prix clairs. Sans surprise.
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
      <section data-stage="5" data-stage-alpha="0.4" data-stage-bg="#fffdf6" data-stage-ink="#164a36" className="relative z-10 border-t border-bone bg-ink-2 px-6 py-32 md:px-10">
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
          Combien coûterait <em>votre site ?</em>
        </h2>
        <div data-reveal className="mt-16">
          <Estimator />
        </div>
      </section>
    </>
  );
}
