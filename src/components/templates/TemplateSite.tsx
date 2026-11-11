import Link from "next/link";
import Photo from "@/components/Photo";
import Scene3D from "@/components/Scene3D";
import ScrollFX from "@/components/ScrollFX";
import type { PhotoKey, SiteContent, TemplateDef } from "@/lib/templates";
import { brand as agency } from "@/lib/config";

type Props = {
  template: TemplateDef;
  content: SiteContent;
  /** Site en ligne : les cadres sans photo restent neutres, sans légende de maquette. */
  bare?: boolean;
};

/** Rend un site client à partir d'un modèle et de son contenu. */
export default function TemplateSite({ template, content, bare = false }: Props) {
  const Layout = { aurore: Aurore, monolithe: Monolithe, pulse: Pulse, atelier: Atelier }[template.id];
  return (
    <>
      <ScrollFX />
      <Layout template={template} content={content} bare={bare} />
      <MobileActions c={content} />
    </>
  );
}

/** Sur téléphone : appeler, venir ou écrire en un geste, toujours sous le pouce. */
function MobileActions({ c }: { c: SiteContent }) {
  const actions = [
    c.phone && { href: tel(c.phone), label: "Appeler" },
    c.address && { href: mapUrl(c.address), label: "Itinéraire", external: true },
    c.email && { href: `mailto:${c.email}`, label: "Écrire" },
  ].filter(Boolean) as { href: string; label: string; external?: boolean }[];
  if (actions.length === 0) return null;
  return (
    <>
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav aria-label="Contact rapide" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/15 bg-[#10130b] text-[#f3f0e6] md:hidden">
        {actions.map((a) => (
          <a
            key={a.label}
            href={a.href}
            {...(a.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex-1 border-r border-white/15 py-4 text-center text-sm font-semibold last:border-r-0 active:bg-white/10"
          >
            {a.label}
          </a>
        ))}
      </nav>
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
    { title: c.s1Title, text: c.s1Text },
    { title: c.s2Title, text: c.s2Text },
    { title: c.s3Title, text: c.s3Text },
  ];
}

function Background({ template }: { template: TemplateDef }) {
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

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-[#140a06]/90 to-transparent px-6 py-5 md:px-12">
        <span className="serif text-2xl italic">{c.brand}</span>
        <nav aria-label="Navigation" className="hidden gap-8 text-sm md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="opacity-75 transition-opacity hover:opacity-100">
              {n.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="rounded-full border border-[#ffd27a]/60 px-5 py-2 text-sm text-[#ffd27a] transition-colors hover:bg-[#ffd27a] hover:text-[#140a06]">
          {c.cta}
        </a>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-dvh max-w-7xl items-center gap-12 px-6 pb-16 pt-28 md:grid-cols-[1.15fr_1fr] md:px-12">
          <div>
            <p className="rise text-sm tracking-wide text-[#ffd27a]">{c.kicker}</p>
            <h1 className="serif rise rise-1 mt-6 text-[clamp(3rem,7.4vw,7.5rem)] italic">{c.heroTitle}</h1>
            <p className="rise rise-2 mt-8 max-w-md text-lg text-[#fff1dc]/75">{c.heroSubtitle}</p>
            <div className="rise rise-3 mt-10 flex flex-wrap items-center gap-6">
              <a href="#contact" className="rounded-full bg-[#ffd27a] px-7 py-3.5 font-medium text-[#140a06]">
                {c.cta}
              </a>
              {c.phone && (
                <a href={tel(c.phone)} className="underline underline-offset-4">
                  {c.phone}
                </a>
              )}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-3 rounded-t-full border border-[#ffd27a]/40" aria-hidden="true" />
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[3/4] rounded-t-full" />
          </div>
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

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[#111214]/15 bg-[#e7e2d8]/90 px-6 py-4 text-sm backdrop-blur-md md:px-10">
        <span className="font-bold uppercase tracking-wide">{c.brand}</span>
        <nav aria-label="Navigation" className="hidden gap-8 md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-[#ff5a1f]">
              {n.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="bg-[#111214] px-5 py-2.5 font-medium text-[#e7e2d8] transition-colors hover:bg-[#ff5a1f]">
          {c.cta}
        </a>
      </header>

      <main className="relative z-10">
        <section className="px-6 pb-16 pt-36 md:px-10">
          <p className="rise text-sm text-[#ff5a1f]">{c.kicker}</p>
          <h1 className="rise rise-1 mt-8 max-w-6xl text-[clamp(3rem,10.5vw,10.5rem)] font-black uppercase leading-[0.85] tracking-tighter">
            {c.heroTitle}
          </h1>
          <div className="relative mt-12">
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[16/8] w-full" />
            <span className="absolute bottom-0 left-0 bg-[#ff5a1f] px-4 py-2 text-sm font-medium text-[#111214]">{L.photoHero}</span>
          </div>
          <div className="rise rise-2 mt-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <p className="max-w-xl text-lg">{c.heroSubtitle}</p>
            {c.phone && (
              <a href={tel(c.phone)} className="text-lg font-semibold underline underline-offset-4">
                {c.phone}
              </a>
            )}
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

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-[#07060d] to-transparent px-6 py-5 md:px-10">
        <span className="text-xl font-black italic tracking-tighter">{c.brand}</span>
        <nav aria-label="Navigation" className="hidden gap-8 text-sm font-medium md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-[#c8ff4d]">
              {n.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="rounded-md bg-[#c8ff4d] px-5 py-2.5 text-sm font-bold text-[#07060d]">
          {c.cta}
        </a>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-dvh max-w-7xl items-center gap-10 px-6 pb-16 pt-28 md:grid-cols-[1.3fr_1fr] md:px-10">
          <div>
            <p className="rise text-sm font-medium text-[#c8ff4d]">{c.kicker}</p>
            <h1 className="rise rise-1 mt-4 text-[clamp(3.2rem,9.5vw,9.5rem)] font-black uppercase italic leading-[0.82] tracking-tighter">
              {c.heroTitle}
            </h1>
            <p className="rise rise-2 mt-8 max-w-md text-lg text-white/70">{c.heroSubtitle}</p>
            <a href="#contact" className="rise rise-3 mt-10 inline-block rounded-md bg-[#c8ff4d] px-8 py-4 font-bold text-[#07060d]">
              {c.cta} →
            </a>
          </div>
          <div className="relative mx-auto w-full max-w-sm md:rotate-2">
            <div className="absolute -inset-2 rounded-xl border-2 border-[#c8ff4d]" aria-hidden="true" />
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

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-[#2a2420]/10 bg-[#f6f1ec]/85 px-6 py-4 backdrop-blur-md md:px-12">
        <span className="serif text-2xl">{c.brand}</span>
        <nav aria-label="Navigation" className="hidden gap-8 text-sm md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="opacity-70 transition-opacity hover:opacity-100">
              {n.label}
            </a>
          ))}
        </nav>
        <a href="#contact" className="rounded-full bg-[#2a2420] px-5 py-2.5 text-sm text-[#f6f1ec]">
          {c.cta}
        </a>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-dvh max-w-7xl items-center gap-12 px-6 pb-16 pt-28 md:grid-cols-[1.2fr_1fr] md:px-12">
          <div>
            <p className="rise text-sm text-[#a8627a]">{c.kicker}</p>
            <h1 className="serif rise rise-1 mt-6 text-[clamp(3rem,7vw,7rem)]">{c.heroTitle}</h1>
            <p className="rise rise-2 mt-8 max-w-md text-lg text-[#2a2420]/70">{c.heroSubtitle}</p>
            <a href="#contact" className="rise rise-3 mt-10 inline-block rounded-full bg-[#2a2420] px-7 py-3.5 text-[#f6f1ec]">
              {c.cta}
            </a>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-3 shadow-2xl shadow-[#a8627a]/15 md:rotate-2">
            <Photo src={c.photoHero} label={L.photoHero} bare={bare} className="aspect-[4/5] rounded-[1.4rem]" />
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
