import Link from "next/link";
import Photo from "@/components/Photo";
import BottomDock from "./BottomDock";
import Scene3D from "@/components/Scene3D";
import ScrollFX from "@/components/ScrollFX";
import type { PhotoKey, SiteContent, TemplateDef } from "@/lib/templates";
import { brand as agency } from "@/lib/config";

type Props = {
  template: TemplateDef;
  content: SiteContent;
  /** Site en ligne : les cadres sans photo restent neutres, sans légende de maquette. */
  bare?: boolean;
  /** Page d'exemple : les cadres vides reçoivent un visuel d'ambiance au lieu de la croix de maquette. */
  demo?: boolean;
};

/** Rend un site client à partir d'un modèle et de son contenu. */
export default function TemplateSite({ template, content, bare = false, demo = false }: Props) {
  const Layout = { aurore: Aurore, monolithe: Monolithe, pulse: Pulse, atelier: Atelier, cabinet: Cabinet, clarte: Clarte, ligne: Ligne }[template.id];
  return (
    <>
      <ScrollFX />
      <div className={demo ? "demo-visuals" : undefined} data-demo={demo ? template.id : undefined}>
        <Layout template={template} content={content} bare={bare} />
      </div>
      <MobileActions c={content} demo={demo} />
    </>
  );
}

const icons = {
  Appeler: "M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z",
  Itinéraire: "M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
  Écrire: "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z",
} as const;

/**
 * Sur téléphone : appeler, venir ou écrire en un geste, dans un panneau collé au bas de la zone visible
 * (voir BottomDock, qui contourne le calcul de Safari sur iPhone) ; la zone de sécurité est respectée. Sur une page d'exemple, il porte aussi
 * le retour aux exemples et la demande de devis, pour n'avoir qu'une seule barre.
 */
function MobileActions({ c, demo }: { c: SiteContent; demo: boolean }) {
  const actions = [
    c.phone && { href: tel(c.phone), label: "Appeler" as const },
    c.address && { href: mapUrl(c.address), label: "Itinéraire" as const, external: true },
    c.email && { href: `mailto:${c.email}`, label: "Écrire" as const },
  ].filter(Boolean) as { href: string; label: keyof typeof icons; external?: boolean }[];
  if (actions.length === 0 && !demo) return null;
  return (
    <>
      <div className={`md:hidden ${demo ? "h-32" : "h-20"}`} aria-hidden="true" />
      <BottomDock className="md:hidden">
      <nav
        aria-label="Contact rapide"
        className="rounded-t-3xl border-t border-white/10 bg-[#111214] pb-[env(safe-area-inset-bottom)] text-[#f3f0e6] shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
      >
        {demo && (
          <div className="flex items-center gap-2 border-b border-white/10 p-2 text-sm">
            <Link href="/exemples" className="rounded-xl px-3 py-2 text-white/70">
              ← Exemples
            </Link>
            <Link href="/#contact" className="ml-auto rounded-xl bg-[#d3e5c9] px-4 py-2 font-semibold text-[#164a36]">
              Un site comme ça
            </Link>
          </div>
        )}
        {actions.length > 0 && (
          <div className="flex">
            {actions.map((a) => (
              <a
                key={a.label}
                href={a.href}
                {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium active:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden="true">
                  <path d={icons[a.label]} />
                </svg>
                {a.label}
              </a>
            ))}
          </div>
        )}
      </nav>
      </BottomDock>
    </>
  );
}

const nav = [
  { href: "#presentation", label: "Présentation" },
  { href: "#prestations", label: "Prestations" },
  { href: "#galerie", label: "Galerie" },
  { href: "#contact", label: "Contact" },
];

const gallery: PhotoKey[] = ["photo1", "photo2", "photo3"];

function services(c: SiteContent) {
  return [
    { title: c.s1Title, text: c.s1Text, price: c.s1Price },
    { title: c.s2Title, text: c.s2Text, price: c.s2Price },
    { title: c.s3Title, text: c.s3Text, price: c.s3Price },
  ];
}

function Background({ template }: { template: TemplateDef }) {
  if (!template.scene) return null;
  return <Scene3D preset={template.scene} colors={template.colors} opacity={template.sceneOpacity} light={template.light} />;
}

function Credit() {
  return (
    <p className="text-xs opacity-60">
      Site créé par{" "}
      <Link href="/" className="underline underline-offset-4">
        {agency.name}
      </Link>
    </p>
  );
}

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
const mapUrl = (address: string) => `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;

/** Infos pratiques : adresse, horaires, contact. Hérite des couleurs du modèle. */
function Infos({ c, className = "" }: { c: SiteContent; className?: string }) {
  return (
    <dl className={`grid gap-10 md:grid-cols-3 ${className}`}>
      {c.address && (
        <div>
          <dt className="text-sm opacity-60">Adresse</dt>
          <dd className="mt-3 text-lg">
            <address className="not-italic">{c.address}</address>
            <a href={mapUrl(c.address)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm underline underline-offset-4">
              Itinéraire ↗
            </a>
          </dd>
        </div>
      )}
      {c.hours && (
        <div>
          <dt className="text-sm opacity-60">Horaires</dt>
          <dd className="mt-3 text-lg">{c.hours}</dd>
        </div>
      )}
      {(c.phone || c.email) && (
        <div>
          <dt className="text-sm opacity-60">Contact</dt>
          <dd className="mt-3 text-lg">
            {c.phone && (
              <a href={tel(c.phone)} className="block">
                {c.phone}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="block break-all underline underline-offset-4">
                {c.email}
              </a>
            )}
          </dd>
        </div>
      )}
    </dl>
  );
}

/* ------------------------------------------------------------------ */
/* AURORE — restaurant. Sombre et chaud, sérif, cadres en arche.        */
/* ------------------------------------------------------------------ */
function Aurore({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  return (
    <div className="relative overflow-x-clip bg-[#140a06] text-[#fff1dc] [--photo-bg:#2a170e]">
      <Background template={template} />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[#140a06]/20 via-[#140a06]/60 to-[#140a06]/90" />

      <header className="fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-[#140a06]/95 to-transparent px-6 py-5 md:px-12">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <nav aria-label="Navigation" className="hidden gap-8 text-sm md:flex">
            {nav.slice(0, 2).map((n) => (
              <a key={n.href} href={n.href} className="opacity-75 transition-opacity hover:opacity-100">
                {n.label}
              </a>
            ))}
          </nav>
          <span className="serif col-start-2 text-center text-3xl italic">{c.brand}</span>
          <div className="flex items-center justify-end gap-8 text-sm">
            {nav.slice(2, 3).map((n) => (
              <a key={n.href} href={n.href} className="hidden opacity-75 transition-opacity hover:opacity-100 md:inline">
                {n.label}
              </a>
            ))}
            <a href="#contact" className="rounded-full border border-[#ffd27a]/60 px-5 py-2 text-[#ffd27a] transition-colors hover:bg-[#ffd27a] hover:text-[#140a06]">
              Réserver
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative mx-auto flex min-h-dvh max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-32 text-center">
          <div className="absolute left-1/2 top-24 w-[min(28rem,80vw)] -translate-x-1/2 opacity-60">
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[3/4] rounded-t-full" />
          </div>
          <div className="relative">
            <p className="rise text-sm uppercase tracking-[0.25em] text-[#ffd27a]">{c.kicker}</p>
            <h1 className="serif rise rise-1 mx-auto mt-6 max-w-5xl text-[clamp(3rem,8vw,8rem)] italic leading-[0.95] drop-shadow-[0_4px_30px_rgba(20,10,6,0.8)]">
              {c.heroTitle}
            </h1>
            <p className="rise rise-2 mx-auto mt-8 max-w-xl text-lg text-[#fff1dc]/85">{c.heroSubtitle}</p>
            <a href="#contact" className="rise rise-3 mt-10 inline-block rounded-full bg-[#ffd27a] px-8 py-4 font-medium text-[#140a06]">
              {c.cta}
            </a>
          </div>
          {(c.hours || c.phone) && (
            <div className="rise rise-3 relative mt-16 flex flex-col gap-2 border-y border-[#ffd27a]/30 py-4 text-sm text-[#fff1dc]/80 md:flex-row md:gap-10">
              {c.hours && <span>{c.hours}</span>}
              {c.phone && (
                <a href={tel(c.phone)} className="text-[#ffd27a]">
                  {c.phone}
                </a>
              )}
            </div>
          )}
        </section>

        <section id="presentation" className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-14 px-6 py-32 md:grid-cols-2 md:px-12">
          <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="aspect-[4/5] rounded-2xl" />
          <div>
            <h2 data-split className="serif text-5xl italic md:text-7xl">
              {c.aboutTitle}
            </h2>
            <p data-scrub-text className="mt-10 text-xl leading-relaxed md:text-2xl">
              {c.aboutText}
            </p>
          </div>
        </section>

        <section id="prestations" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 md:px-12">
          <p className="mb-8 text-sm tracking-wide text-[#ffd27a]">La carte</p>
          <div data-stagger className="border-t border-[#fff1dc]/20">
            {services(c).map((s, i) => (
              <article key={i} className="grid gap-3 border-b border-[#fff1dc]/20 py-10 md:grid-cols-[6rem_1fr_1.2fr] md:items-baseline">
                <span className="serif text-3xl italic text-[#ffd27a]">0{i + 1}</span>
                <h3 className="serif text-4xl italic md:text-6xl">{s.title}</h3>
                <p className="text-lg text-[#fff1dc]/75">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </article>
            ))}
          </div>
        </section>

        <section id="galerie" data-hscroll className="scroll-mt-24 overflow-hidden">
          <div data-hscroll-pin>
          <div data-hscroll-track className="flex gap-6 overflow-x-auto px-6 py-10 md:h-dvh md:items-center md:gap-10 md:overflow-visible md:px-[8vw]">
            <h2 className="serif w-[70vw] shrink-0 text-5xl italic md:w-[26vw] md:text-7xl">En images</h2>
            {gallery.map((k) => (
              <figure key={k} className="w-[78vw] shrink-0 md:w-[36vw]">
                <Photo src={c[k]} label={L[k]} bare={bare} className="aspect-[4/5] rounded-2xl" />
                <figcaption className="mt-4 text-sm text-[#fff1dc]/60">{L[k]}</figcaption>
              </figure>
            ))}
          </div>
          </div>
        </section>

        <section className="px-6 py-40 text-center">
          <blockquote data-split className="serif mx-auto max-w-5xl text-4xl italic leading-tight md:text-6xl">
            « {c.quote} »
          </blockquote>
          <p data-reveal className="mt-8 text-sm tracking-wide text-[#ffd27a]">
            {c.quoteAuthor}
          </p>
        </section>

        <footer id="contact" className="scroll-mt-24 border-t border-[#fff1dc]/20 bg-[#140a06]/80 px-6 py-24 backdrop-blur-md md:px-12">
          <div className="mx-auto max-w-7xl">
            <h2 data-split className="serif text-6xl italic md:text-8xl">
              {c.cta}
            </h2>
            <Infos c={c} className="mt-16" />
            <div className="mt-16">
              <Credit />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MONOLITHE — architecte, artisan. Clair, grille stricte, angles vifs. */
/* ------------------------------------------------------------------ */
function Monolithe({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  return (
    <div className="relative overflow-x-clip bg-[#e7e2d8] text-[#111214] [--photo-bg:#d4cec1]">
      <Background template={template} />

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[#111214]/15 bg-[#e7e2d8]/95 px-6 py-4 text-sm md:inset-y-0 md:left-0 md:right-auto md:w-56 md:flex-col md:items-start md:justify-between md:border-b-0 md:border-r md:py-8">
        <span className="text-lg font-black uppercase leading-none tracking-tight">{c.brand}</span>
        <nav aria-label="Navigation" className="hidden flex-col gap-4 md:flex">
          {nav.map((n, i) => (
            <a key={n.href} href={n.href} className="group flex items-baseline gap-3 hover:text-[#ff5a1f]">
              <span className="text-xs text-[#111214]/40 group-hover:text-[#ff5a1f]">0{i + 1}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3 md:flex-col md:items-start">
          {c.phone && (
            <a href={tel(c.phone)} className="hidden font-semibold md:block">
              {c.phone}
            </a>
          )}
          <a href="#contact" className="bg-[#ff5a1f] px-4 py-2.5 font-semibold text-[#111214]">
            Devis gratuit
          </a>
        </div>
      </header>

      <main className="relative z-10 md:ml-56">
        <section className="px-6 pb-16 pt-28 md:px-10 md:pt-16">
          <p className="rise text-sm font-medium text-[#ff5a1f]">{c.kicker}</p>
          <h1 className="rise rise-1 mt-6 text-[clamp(3rem,9vw,9.5rem)] font-black uppercase leading-[0.85] tracking-tighter">{c.heroTitle}</h1>
          <div className="mt-10 grid gap-6 md:grid-cols-[1.6fr_1fr]">
            <div className="relative">
              <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[16/10] w-full" />
              <span className="absolute bottom-0 left-0 bg-[#ff5a1f] px-4 py-2 text-sm font-medium text-[#111214]">{L.photoHero}</span>
            </div>
            <div className="rise rise-2 flex flex-col justify-between gap-8 border-t-4 border-[#111214] pt-6">
              <p className="text-lg">{c.heroSubtitle}</p>
              <a href="#contact" className="bg-[#111214] px-6 py-4 text-center font-semibold text-[#e7e2d8] transition-colors hover:bg-[#ff5a1f] hover:text-[#111214]">
                {c.cta} →
              </a>
            </div>
          </div>
        </section>

        <section id="presentation" className="grid scroll-mt-24 items-center gap-12 px-6 py-32 md:grid-cols-2 md:px-10">
          <div>
            <p className="text-sm text-[#111214]/60">01 — Approche</p>
            <h2 data-split className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter md:text-7xl">
              {c.aboutTitle}
            </h2>
            <p data-scrub-text className="mt-10 max-w-xl text-xl leading-relaxed">
              {c.aboutText}
            </p>
          </div>
          <div className="relative md:ml-10">
            <div className="absolute -bottom-4 -right-4 h-full w-full bg-[#ff5a1f]" aria-hidden="true" />
            <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="relative aspect-[4/5]" />
          </div>
        </section>

        <section id="prestations" className="scroll-mt-24 px-6 pb-32 md:px-10">
          <p className="mb-8 text-sm text-[#111214]/60">02 — Prestations</p>
          <div data-stagger className="border-t-2 border-[#111214]">
            {services(c).map((s, i) => (
              <article
                key={i}
                className="grid gap-4 border-b-2 border-[#111214] py-10 transition-colors duration-500 hover:bg-[#111214] hover:text-[#e7e2d8] md:grid-cols-6 md:px-6"
              >
                <span className="text-sm text-[#ff5a1f]">0{i + 1}</span>
                <h3 className="text-4xl font-black uppercase tracking-tighter md:col-span-2 md:text-5xl">{s.title}</h3>
                <p className="self-end text-lg md:col-span-3">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </article>
            ))}
          </div>
        </section>

        <section id="galerie" className="scroll-mt-24 px-6 pb-32 md:px-10">
          <p className="mb-8 text-sm text-[#111214]/60">03 — Réalisations</p>
          <div className="grid gap-4 md:grid-cols-6">
            <figure className="md:col-span-4">
              <Photo src={c.photo1} label={L.photo1} bare={bare} className="aspect-[16/10]" />
              <figcaption className="mt-3 flex justify-between text-sm">
                <span className="font-semibold uppercase">{L.photo1}</span>
                <span className="text-[#111214]/60">01</span>
              </figcaption>
            </figure>
            <div className="grid gap-4 md:col-span-2">
              {(["photo2", "photo3"] as const).map((k, i) => (
                <figure key={k}>
                  <Photo src={c[k]} label={L[k]} bare={bare} className="aspect-[16/10] md:aspect-[4/3]" />
                  <figcaption className="mt-3 flex justify-between text-sm">
                    <span className="font-semibold uppercase">{L[k]}</span>
                    <span className="text-[#111214]/60">0{i + 2}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section data-scrub-scale className="mx-6 bg-[#111214] px-8 py-28 text-[#e7e2d8] md:mx-10 md:px-20">
          <blockquote data-split className="max-w-5xl text-4xl font-black uppercase leading-[0.95] tracking-tighter md:text-6xl">
            {c.quote}
          </blockquote>
          <p className="mt-8 text-sm text-[#ff5a1f]">{c.quoteAuthor}</p>
        </section>

        <footer id="contact" className="scroll-mt-24 px-6 py-24 md:px-10">
          <h2 data-split className="text-6xl font-black uppercase leading-[0.85] tracking-tighter md:text-9xl">
            {c.cta}
          </h2>
          <Infos c={c} className="mt-16 border-t-2 border-[#111214] pt-10" />
          <div className="mt-16">
            <Credit />
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* PULSE — sport, événement. Noir, néon, titres géants.                 */
/* ------------------------------------------------------------------ */
function Pulse({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  const band = Array.from({ length: 8 }, () => c.brand);
  return (
    <div className="relative overflow-x-clip bg-[#07060d] text-[#f4f4f4] [--photo-bg:#14131f]">
      <Background template={template} />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-10">
        <span className="text-xl font-black italic tracking-tighter">{c.brand}</span>
        {c.phone && (
          <a href={tel(c.phone)} className="text-sm font-bold text-[#c8ff4d]">
            {c.phone}
          </a>
        )}
      </div>
      <header className="fixed bottom-5 left-1/2 z-30 hidden -translate-x-1/2 md:block">
        <nav aria-label="Navigation" className="flex items-center gap-1 rounded-xl border border-white/15 bg-[#07060d]/90 p-1.5 text-sm font-medium backdrop-blur">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="rounded-lg px-4 py-2 hover:bg-white/10">
              {n.label}
            </a>
          ))}
          <a href="#contact" className="rounded-lg bg-[#c8ff4d] px-4 py-2 font-bold text-[#07060d]">
            {c.cta}
          </a>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="relative flex min-h-dvh flex-col justify-center px-6 pb-24 pt-28 md:px-10">
          <div className="pointer-events-none absolute right-6 top-1/2 hidden w-72 -translate-y-1/2 rotate-3 md:block lg:right-16 lg:w-80">
            <div className="absolute -inset-2 rounded-xl border-2 border-[#c8ff4d]" aria-hidden="true" />
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[4/5] rounded-lg" />
          </div>
          <p className="rise relative text-sm font-medium uppercase tracking-widest text-[#c8ff4d]">{c.kicker}</p>
          <h1 className="rise rise-1 relative mt-4 max-w-[14ch] text-[clamp(3.4rem,11vw,11rem)] font-black uppercase italic leading-[0.8] tracking-tighter">
            {c.heroTitle}
          </h1>
          <div className="rise rise-2 relative mt-10 flex flex-col gap-6 md:flex-row md:items-center">
            <a href="#contact" className="self-start rounded-md bg-[#c8ff4d] px-8 py-4 font-bold text-[#07060d]">
              {c.cta} →
            </a>
            <p className="max-w-md text-white/70">{c.heroSubtitle}</p>
          </div>
          <div className="mt-10 md:hidden">
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[4/5] rounded-lg" />
          </div>
        </section>

        <div className="-rotate-1 overflow-hidden bg-[#c8ff4d] py-3 text-[#07060d]" aria-hidden="true">
          <div className="marquee-track">
            {[...band, ...band].map((b, i) => (
              <span key={i} className="mx-6 text-3xl font-black uppercase italic tracking-tighter">
                {b} /
              </span>
            ))}
          </div>
        </div>

        <section id="presentation" className="mx-auto grid max-w-7xl scroll-mt-24 items-center gap-14 px-6 py-32 md:grid-cols-2 md:px-10">
          <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="aspect-square rounded-lg md:-rotate-2" />
          <div>
            <h2 data-split className="text-5xl font-black uppercase italic leading-[0.9] tracking-tighter md:text-7xl">
              {c.aboutTitle}
            </h2>
            <p data-scrub-text className="mt-10 text-xl leading-relaxed">
              {c.aboutText}
            </p>
          </div>
        </section>

        <section id="prestations" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-32 md:px-10">
          <div data-stagger className="grid gap-4 md:grid-cols-3">
            {services(c).map((s, i) => (
              <article key={i} className="rounded-lg border border-white/15 bg-[#0e0d16]/90 p-8">
                <span className="text-sm font-medium text-[#ff3df2]">0{i + 1}</span>
                <h3 className="mt-14 text-4xl font-black uppercase italic tracking-tighter text-[#c8ff4d]">{s.title}</h3>
                <p className="mt-3 text-white/70">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </article>
            ))}
          </div>
        </section>

        <section id="galerie" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-32 md:px-10">
          <div className="grid gap-4 md:grid-cols-3">
            {gallery.map((k, i) => (
              <figure key={k} className={i === 1 ? "md:translate-y-12" : ""}>
                <Photo src={c[k]} label={L[k]} bare={bare} className="aspect-[3/4] rounded-lg" />
                <figcaption className="mt-3 text-sm font-bold uppercase italic">{L[k]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="px-6 py-36 text-center">
          <blockquote data-split className="mx-auto max-w-5xl text-4xl font-black uppercase italic leading-[0.95] tracking-tighter md:text-6xl">
            “{c.quote}”
          </blockquote>
          <p data-reveal className="mt-8 text-sm font-medium text-[#c8ff4d]">
            {c.quoteAuthor}
          </p>
        </section>

        <footer id="contact" className="scroll-mt-24 px-6 pb-16 md:px-10">
          <div className="mx-auto max-w-7xl rounded-xl border border-white/15 bg-[#0e0d16]/95 p-8 md:p-16">
            <h2 data-split className="text-5xl font-black uppercase italic leading-[0.85] tracking-tighter md:text-8xl">
              {c.cta}
            </h2>
            <Infos c={c} className="mt-14" />
            <div className="mt-14">
              <Credit />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ATELIER — créateur, boutique, bien-être. Clair, doux, beaucoup d'air. */
/* ------------------------------------------------------------------ */
function Atelier({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  return (
    <div className="relative overflow-x-clip bg-[#f6f1ec] text-[#2a2420] [--photo-bg:#e9e1d9]">
      <Background template={template} />
      <div className="pointer-events-none fixed inset-0 bg-[#f6f1ec]/55" />

      <header className="sticky top-0 z-30">
        {c.hours && <p className="bg-[#2a2420] px-6 py-2 text-center text-xs text-[#f6f1ec]">{c.hours}</p>}
        <div className="flex items-center justify-between border-b border-[#2a2420]/10 bg-[#f6f1ec]/95 px-6 py-3 backdrop-blur-md md:px-12">
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[#2a2420]/20 px-4 py-2 text-sm">
              <span aria-hidden="true">☰</span> Menu
            </summary>
            <nav aria-label="Navigation" className="absolute left-0 mt-2 flex w-56 flex-col rounded-2xl bg-white p-2 shadow-xl shadow-[#a8627a]/15">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className="rounded-xl px-4 py-3 hover:bg-[#f6f1ec]">
                  {n.label}
                </a>
              ))}
            </nav>
          </details>
          <span className="serif text-2xl md:text-3xl">{c.brand}</span>
          <a href="#contact" className="hidden rounded-full bg-[#2a2420] px-5 py-2.5 text-sm text-[#f6f1ec] sm:inline-block">
            {c.cta}
          </a>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pb-20 pt-12 md:px-12">
          <div className="grid items-end gap-4 md:grid-cols-[1fr_1.3fr_1fr]">
            <Photo src={c.photo1} label={L.photo1} bare={bare} className="hidden aspect-square rounded-t-full md:block" />
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[5/4] rounded-[2rem]" />
            <Photo src={c.photo2} label={L.photo2} bare={bare} className="hidden aspect-square rounded-b-full md:block" />
          </div>
          <div className="relative mx-auto -mt-16 max-w-3xl rounded-[2rem] bg-[#f6f1ec] px-6 pt-10 text-center md:-mt-24">
            <p className="rise text-sm text-[#a8627a]">{c.kicker}</p>
            <h1 className="serif rise rise-1 mt-4 text-[clamp(2.8rem,6.5vw,6rem)] leading-[1]">{c.heroTitle}</h1>
            <p className="rise rise-2 mx-auto mt-6 max-w-lg text-lg text-[#2a2420]/70">{c.heroSubtitle}</p>
            <a href="#contact" className="rise rise-3 mt-8 inline-block rounded-full bg-[#2a2420] px-7 py-3.5 text-[#f6f1ec]">
              {c.cta}
            </a>
          </div>
        </section>

        <section id="presentation" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-28 text-center md:px-12">
          <h2 data-split className="serif text-5xl md:text-7xl">
            {c.aboutTitle}
          </h2>
          <p data-scrub-text className="mx-auto mt-10 max-w-2xl text-xl leading-relaxed">
            {c.aboutText}
          </p>
          <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="mt-16 aspect-[16/9] rounded-[2rem]" />
        </section>

        <section id="prestations" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-28 md:px-12">
          <div data-stagger className="grid gap-5 md:grid-cols-3">
            {services(c).map((s, i) => (
              <article key={i} className="rounded-[2rem] bg-white/85 p-10 shadow-xl shadow-[#a8627a]/10">
                <span className="serif text-4xl text-[#c98a9a]">{i + 1}.</span>
                <h3 className="serif mt-8 text-4xl">{s.title}</h3>
                <p className="mt-3 text-[#2a2420]/70">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </article>
            ))}
          </div>
        </section>

        <section id="galerie" className="mx-auto max-w-7xl scroll-mt-24 px-6 pb-28 md:px-12">
          <div className="grid items-end gap-5 md:grid-cols-3">
            {gallery.map((k, i) => (
              <figure key={k}>
                <Photo
                  src={c[k]}
                  label={L[k]}
                  bare={bare}
                  className={`rounded-t-full rounded-b-[2rem] ${i === 1 ? "aspect-[3/5]" : "aspect-[3/4]"}`}
                />
                <figcaption className="serif mt-4 text-center text-2xl">{L[k]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section data-scrub-scale className="mx-6 bg-[#2a2420] px-8 py-28 text-center text-[#f6f1ec] md:mx-12">
          <blockquote data-split className="serif mx-auto max-w-4xl text-4xl italic md:text-6xl">
            « {c.quote} »
          </blockquote>
          <p className="mt-8 text-sm text-[#f2b8c6]">{c.quoteAuthor}</p>
        </section>

        <footer id="contact" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24 md:px-12">
          <h2 data-split className="serif text-6xl md:text-8xl">
            {c.cta}
          </h2>
          <Infos c={c} className="mt-14 border-t border-[#2a2420]/15 pt-10" />
          <div className="mt-14">
            <Credit />
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CABINET — avocat, comptable, conseil. Clair, bleu nuit, sérif, sans  */
/* fond animé : la rigueur avant l'effet.                               */
/* ------------------------------------------------------------------ */
function Cabinet({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  return (
    <div className="relative overflow-x-clip bg-[#f7f6f2] text-[#14213d] [--photo-bg:#e7e4da]">
      <div className="bg-[#14213d] px-6 py-2 text-center text-xs text-[#f7f6f2]/80">
        {[c.address, c.phone].filter(Boolean).join("  ·  ")}
      </div>
      <header className="border-b border-[#14213d]/10 bg-[#f7f6f2]">
        <div className="mx-auto max-w-6xl px-6 pt-8 text-center">
          <span className="serif text-4xl md:text-5xl">{c.brand}</span>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-[#b08d57]">{c.kicker}</p>
          <nav aria-label="Navigation" className="mt-6 flex justify-center gap-6 border-t border-[#14213d]/10 py-4 text-sm md:gap-10">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="opacity-70 transition-opacity hover:opacity-100">
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-[#14213d] px-6 py-24 text-center text-[#f7f6f2] md:py-32">
          <div className="mx-auto h-px w-16 bg-[#b08d57]" aria-hidden="true" />
          <h1 className="serif rise mx-auto mt-10 max-w-4xl text-[clamp(2.6rem,6vw,5.2rem)] leading-[1.05]">{c.heroTitle}</h1>
          <p className="rise rise-1 mx-auto mt-8 max-w-2xl text-lg text-[#f7f6f2]/75">{c.heroSubtitle}</p>
          <div className="rise rise-2 mt-12 flex flex-wrap justify-center gap-4">
            <a href="#contact" className="bg-[#b08d57] px-7 py-3.5 text-[#14213d]">
              {c.cta}
            </a>
            <a href="#prestations" className="border border-[#f7f6f2]/40 px-7 py-3.5">
              Nos domaines
            </a>
          </div>
        </section>

        <section id="presentation" className="scroll-mt-24 border-y border-[#14213d]/10 bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[1fr_1.6fr]">
            <h2 data-reveal className="serif text-4xl md:text-5xl">
              {c.aboutTitle}
            </h2>
            <div>
              <p data-reveal className="text-xl leading-relaxed text-[#14213d]/80">
                {c.aboutText}
              </p>
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[4/5]" />
                <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="aspect-[4/5]" />
              </div>
            </div>
          </div>
        </section>

        <section id="prestations" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <p className="text-xs uppercase tracking-[0.2em] text-[#b08d57]">Domaines d&apos;intervention</p>
          <ol data-stagger className="mt-10 border-t border-[#14213d]/15">
            {services(c).map((s, i) => (
              <li key={i} className="grid gap-4 border-b border-[#14213d]/15 py-10 md:grid-cols-[6rem_1fr_1.4fr] md:items-baseline">
                <span className="serif text-3xl text-[#b08d57]">{["I", "II", "III"][i]}.</span>
                <h3 className="serif text-3xl">{s.title}</h3>
                <p className="text-[#14213d]/75">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </li>
            ))}
          </ol>
        </section>

        <section id="galerie" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {gallery.map((k) => (
              <figure key={k}>
                <Photo src={c[k]} label={L[k]} bare={bare} className="aspect-square" />
                <figcaption className="mt-3 text-sm text-[#14213d]/60">{L[k]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-white px-6 py-24 text-center">
          <div className="mx-auto h-px w-16 bg-[#b08d57]" aria-hidden="true" />
          <blockquote className="serif mx-auto mt-10 max-w-3xl text-3xl italic leading-snug md:text-4xl">« {c.quote} »</blockquote>
          <p className="mt-6 text-sm text-[#14213d]/60">{c.quoteAuthor}</p>
        </section>

        <footer id="contact" className="scroll-mt-24 bg-[#14213d] text-[#f7f6f2]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <h2 className="serif text-4xl md:text-6xl">{c.cta}</h2>
            <Infos c={c} className="mt-14 border-t border-white/15 pt-10" />
            <div className="mt-14">
              <Credit />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CLARTÉ — santé, paramédical. Blanc, vert d'eau, cartes arrondies.    */
/* ------------------------------------------------------------------ */
function Clarte({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  return (
    <div className="relative overflow-x-clip bg-white text-[#0f2a2e] [--photo-bg:#e6f2f1]">
      <header className="fixed inset-x-0 top-4 z-30 flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-full border border-[#0f2a2e]/10 bg-white/95 p-1.5 pl-4 shadow-lg shadow-[#0f2a2e]/5 backdrop-blur">
          <span className="mr-2 text-sm font-semibold">{c.brand}</span>
          <nav aria-label="Navigation" className="hidden gap-1 text-sm md:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3 py-2 text-[#0f2a2e]/70 hover:bg-[#e6f2f1] hover:text-[#0f766e]">
                {n.label}
              </a>
            ))}
          </nav>
          <a href="#contact" className="rounded-full bg-[#0f766e] px-4 py-2 text-sm font-medium text-white">
            Rendez-vous
          </a>
        </div>
      </header>

      <main>
        <section className="grid min-h-dvh md:grid-cols-2">
          <div className="relative min-h-[50vh]">
            <div className="absolute inset-0">
              <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="size-full" />
            </div>
          </div>
          <div className="flex flex-col justify-center bg-[#f3f8f8] px-6 py-24 md:px-14">
            <p className="rise text-sm font-medium text-[#0f766e]">{c.kicker}</p>
            <h1 className="rise rise-1 mt-5 text-[clamp(2.4rem,4.6vw,4rem)] font-semibold leading-[1.08] tracking-tight">{c.heroTitle}</h1>
            <p className="rise rise-2 mt-6 max-w-lg text-lg text-[#0f2a2e]/70">{c.heroSubtitle}</p>
            <a href="#contact" className="rise rise-3 mt-10 self-start rounded-full bg-[#0f766e] px-8 py-4 font-medium text-white">
              {c.cta}
            </a>
            {(c.hours || c.phone) && (
              <div className="rise rise-3 mt-10 grid gap-4 rounded-2xl bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
                {c.hours && (
                  <p>
                    <span className="block font-semibold text-[#0f766e]">Horaires</span>
                    {c.hours}
                  </p>
                )}
                {c.phone && (
                  <p>
                    <span className="block font-semibold text-[#0f766e]">Téléphone</span>
                    <a href={tel(c.phone)}>{c.phone}</a>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section id="prestations" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
          <div data-stagger className="grid gap-5 md:grid-cols-3">
            {services(c).map((s, i) => (
              <article key={i} className="rounded-3xl bg-[#f3f8f8] p-8">
                <span className="grid size-11 place-items-center rounded-2xl bg-white font-semibold text-[#0f766e] shadow-sm">{i + 1}</span>
                <h3 className="mt-6 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-[#0f2a2e]/70">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </article>
            ))}
          </div>
        </section>

        <section id="presentation" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-12 px-6 pb-24 md:grid-cols-2">
          <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="aspect-[4/5] rounded-3xl" />
          <div>
            <h2 data-reveal className="text-4xl font-semibold tracking-tight md:text-5xl">
              {c.aboutTitle}
            </h2>
            <p data-reveal className="mt-6 text-lg leading-relaxed text-[#0f2a2e]/75">
              {c.aboutText}
            </p>
            <blockquote className="mt-10 border-l-4 border-[#0f766e] pl-6">
              <p className="text-lg italic">« {c.quote} »</p>
              <footer className="mt-2 text-sm text-[#0f2a2e]/60">{c.quoteAuthor}</footer>
            </blockquote>
          </div>
        </section>

        <section id="galerie" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
          <div className="grid gap-5 md:grid-cols-3">
            {gallery.map((k) => (
              <figure key={k}>
                <Photo src={c[k]} label={L[k]} bare={bare} className="aspect-[4/3] rounded-3xl" />
                <figcaption className="mt-3 text-sm text-[#0f2a2e]/60">{L[k]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <footer id="contact" className="scroll-mt-24 px-6 pb-16">
          <div className="mx-auto max-w-6xl rounded-3xl bg-[#e6f2f1] p-8 md:p-14">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">{c.cta}</h2>
              {c.phone && (
                <a href={tel(c.phone)} className="rounded-full bg-[#0f766e] px-7 py-3.5 text-center font-medium text-white">
                  Appeler le cabinet
                </a>
              )}
            </div>
            <Infos c={c} className="mt-12 border-t border-[#0f2a2e]/10 pt-10" />
            <div className="mt-12">
              <Credit />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LIGNE — immobilier, architecture intérieure, conseil. Noir sur       */
/* blanc, grille éditoriale, grandes photos.                            */
/* ------------------------------------------------------------------ */
function Ligne({ template, content: c, bare }: Props) {
  const L = template.photoLabels;
  return (
    <div className="relative overflow-x-clip bg-white text-[#111] [--photo-bg:#eeeeec]">
      <main>
        <section className="relative flex min-h-dvh flex-col justify-between bg-[#1a1a1a] text-white">
          <div className="absolute inset-0">
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="size-full opacity-90" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/40" />
          <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
            <span className="text-sm font-semibold uppercase tracking-[0.3em]">{c.brand}</span>
            <a href="#contact" className="text-xs uppercase tracking-[0.2em] underline underline-offset-8">
              {c.cta}
            </a>
          </header>
          <div className="relative z-10 px-6 pb-12 md:px-10">
            <p className="rise text-xs uppercase tracking-[0.3em] text-white/70">{c.kicker}</p>
            <h1 className="rise rise-1 mt-5 max-w-5xl text-[clamp(2.8rem,7vw,6.5rem)] font-medium leading-[0.98] tracking-tight">{c.heroTitle}</h1>
            <div className="rise rise-2 mt-8 flex flex-col gap-6 border-t border-white/25 pt-6 md:flex-row md:items-end md:justify-between">
              <p className="max-w-xl text-lg text-white/80">{c.heroSubtitle}</p>
              <nav aria-label="Navigation" className="flex flex-wrap gap-6 text-xs uppercase tracking-[0.2em] text-white/70">
                {nav.map((n) => (
                  <a key={n.href} href={n.href} className="hover:text-white">
                    {n.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </section>

        <section id="presentation" className="grid scroll-mt-24 gap-10 px-6 py-24 md:grid-cols-[1fr_2fr] md:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">01 — Le studio</p>
          <div>
            <h2 data-reveal className="text-4xl font-medium tracking-tight md:text-6xl">
              {c.aboutTitle}
            </h2>
            <p data-reveal className="mt-8 max-w-2xl text-xl leading-relaxed text-[#111]/75">
              {c.aboutText}
            </p>
          </div>
        </section>

        <section id="prestations" className="scroll-mt-24 border-y border-[#111]/15 px-6 md:px-10">
          <div className="grid md:grid-cols-3">
            {services(c).map((s, i) => (
              <article key={i} className="border-b border-[#111]/15 py-12 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0">
                <span className="text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">0{i + 1}</span>
                <h3 className="mt-6 text-3xl font-medium tracking-tight">{s.title}</h3>
                <p className="mt-3 text-[#111]/70">{s.text}</p>
                {s.price && <p className="mt-5 w-fit whitespace-nowrap rounded-full border border-current/25 px-3 py-1 text-sm font-semibold">{s.price}</p>}
              </article>
            ))}
          </div>
        </section>

        <section id="galerie" className="scroll-mt-24 px-6 py-24 md:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8a8a8a]">02 — Réalisations</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 md:grid-rows-2">
            <figure className="md:row-span-2">
              <Photo src={c.photo1} label={L.photo1} bare={bare} className="aspect-[4/5] md:aspect-auto md:h-full" />
            </figure>
            <figure>
              <Photo src={c.photo2} label={L.photo2} bare={bare} className="aspect-[16/10]" />
            </figure>
            <figure>
              <Photo src={c.photo3} label={L.photo3} bare={bare} className="aspect-[16/10]" />
            </figure>
          </div>
          <Photo src={c.photoAbout} label={L.photoAbout} bare={bare} className="mt-4 aspect-[21/9]" />
        </section>

        <section className="bg-[#111] px-6 py-28 text-white md:px-10">
          <blockquote className="max-w-4xl text-3xl font-medium leading-tight tracking-tight md:text-5xl">“{c.quote}”</blockquote>
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/50">{c.quoteAuthor}</p>
        </section>

        <footer id="contact" className="scroll-mt-24 px-6 py-24 md:px-10">
          <h2 className="text-4xl font-medium tracking-tight md:text-7xl">{c.cta}</h2>
          <Infos c={c} className="mt-14 border-t border-[#111]/15 pt-10" />
          <div className="mt-14">
            <Credit />
          </div>
        </footer>
      </main>
    </div>
  );
}
