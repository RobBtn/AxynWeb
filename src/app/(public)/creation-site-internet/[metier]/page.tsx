import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import TemplateCard from "@/components/TemplateCard";
import { pricing } from "@/lib/config";
import { getMetier, metiers } from "@/lib/metiers";
import { area, breadcrumbLd, faqLd, openGraph, serviceLd } from "@/lib/seo";
import { getTemplate } from "@/lib/templates";

type Props = { params: Promise<{ metier: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => metiers.map((m) => ({ metier: m.slug }));

const title = (name: string) => `Création de site internet pour ${name}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = getMetier((await params).metier);
  if (!m) return {};
  const path = `/creation-site-internet/${m.slug}`;
  const description = `${title(m.name)} à ${area.mainCity} et partout en France : site moderne et sécurisé, modifiable depuis votre espace client, en ligne en 72 h dès ${pricing.offers[0].price} €.`;
  return { title: `${title(m.name)} à ${area.mainCity}`, description, alternates: { canonical: path }, openGraph: openGraph(path, { title: title(m.name), description }) };
}

export default async function MetierPage({ params }: Props) {
  const m = getMetier((await params).metier);
  if (!m) notFound();
  const template = getTemplate(m.template);
  const path = `/creation-site-internet/${m.slug}`;
  const others = metiers.filter((o) => o.slug !== m.slug);

  return (
    <>
      <JsonLd
        items={[
          serviceLd(title(m.name), m.intro, path, m.plural),
          faqLd(m.faq),
          breadcrumbLd([["Création de site internet", "/creation-site-internet"], [m.plural, path]]),
        ]}
      />

      <section className="px-6 pb-16 pt-44 md:px-10">
        <nav aria-label="Fil d'Ariane" className="kicker rise">
          <Link href="/">Accueil</Link> / <Link href="/creation-site-internet">Création de site internet</Link> / {m.plural}
        </nav>
        <h1 className="display rise rise-1 mt-6 max-w-5xl text-[clamp(2.6rem,7vw,6.5rem)]">
          {title(m.name)} <em>à {area.mainCity}</em>
        </h1>
        <p className="rise rise-2 mt-8 max-w-2xl text-lg">{m.intro}</p>
        <div className="rise rise-3 mt-10 flex flex-wrap gap-3">
          <Link href="/#contact" className="btn btn-primary" data-magnetic>
            Estimer mon site <span aria-hidden="true">→</span>
          </Link>
          {template && (
            <Link href={`/exemples/${template.id}`} className="btn btn-ghost">
              Voir l&apos;exemple {template.name}
            </Link>
          )}
        </div>
      </section>

      <section className="border-t border-bone bg-ink-2 px-6 py-24 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <h2 data-reveal className="display text-4xl md:text-6xl">
            Ce que vos clients cherchent
          </h2>
          <ul data-stagger className="border-t border-bone">
            {m.needs.map((n) => (
              <li key={n} className="border-b border-line py-5 text-lg">
                {n}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-24 md:px-10">
        <h2 data-reveal className="display max-w-4xl text-4xl md:text-6xl">
          Votre site de {m.name}, pensé pour convertir
        </h2>
        <div data-stagger className="mt-14 grid gap-5 md:grid-cols-3">
          {m.sections.map((s) => (
            <article key={s.title} className="rounded-2xl border border-bone bg-ink-2 p-8">
              <h3 className="text-xl font-medium">{s.title}</h3>
              <p className="mt-3 text-mute">{s.text}</p>
            </article>
          ))}
        </div>
        {template && (
          <div data-reveal className="mt-16 grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <h3 className="display text-3xl md:text-5xl">Un exemple pour vous inspirer : {template.name}</h3>
              <p className="mt-4 max-w-md text-mute">{template.pitch} Votre site sera créé de zéro, à votre image : cet exemple montre seulement l&apos;ambiance possible.</p>
            </div>
            <TemplateCard t={template} className="h-[28rem] md:h-auto" />
          </div>
        )}
      </section>

      <section className="zone-dark px-6 py-24 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 data-reveal className="display text-4xl md:text-6xl">
              Bien référencé à {area.mainCity} et autour
            </h2>
            <p className="mt-6 max-w-md text-bone/75">
              Un beau site ne sert à rien s&apos;il n&apos;est pas trouvé. Titres, balises, données structurées et vitesse
              sont travaillés dès la création. Nos conseils pour un {m.name} :
            </p>
          </div>
          <ul data-stagger className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {m.seoTips.map((t, i) => (
              <li key={t} className="bg-ink p-7">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <p className="mt-3 text-lg">{t}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-bone px-6 py-24 md:px-10">
        <h2 data-reveal className="display text-4xl md:text-6xl">
          Combien coûte un site de {m.name} ?
        </h2>
        <p className="mt-6 max-w-2xl text-lg">
          {pricing.offers.map((o, i) => (
            <span key={o.id}>
              {i > 0 && (i === pricing.offers.length - 1 ? " et " : ", ")}
              <strong>{o.name}</strong> {o.from ? "dès " : ""}
              {o.price} €
            </span>
          ))}
          , puis {pricing.maintenanceMonthly} € par mois pour l&apos;hébergement en Europe, le HTTPS, les sauvegardes et
          l&apos;espace client, sans engagement.
        </p>
        <Link href="/#tarifs" className="btn btn-ghost mt-8">
          Détail des formules
        </Link>
      </section>

      <section className="border-t border-bone bg-ink-2 px-6 py-24 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <h2 data-reveal className="display text-4xl md:text-6xl">
            Questions fréquentes
          </h2>
          <div className="border-t border-bone">
            {m.faq.map((f) => (
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

      <section className="px-6 py-24 md:px-10">
        <h2 className="display text-3xl md:text-4xl">Autres métiers</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/creation-site-internet/${o.slug}`} className="btn btn-ghost btn-sm">
                Site pour {o.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
