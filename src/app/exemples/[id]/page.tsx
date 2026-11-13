import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TemplateSite from "@/components/templates/TemplateSite";
import { getTemplate } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTemplate((await params).id);
  return t
    ? { title: `Exemple de site ${t.name} — ${t.sector}`, description: t.pitch, alternates: { canonical: `/exemples/${t.id}` } }
    : {};
}

/** Démonstration plein écran d'un exemple, avec une barre flottante pour revenir ou demander un site. */
export default async function TemplateDemo({ params }: Props) {
  const template = getTemplate((await params).id);
  if (!template) notFound();

  return (
    <>
      <TemplateSite template={template} content={template.content} demo />
      <aside
        aria-label="Démonstration"
        className="zone-dark fixed bottom-20 left-1/2 md:bottom-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line p-1.5 pl-5 text-sm shadow-2xl"
      >
        <span className="hidden whitespace-nowrap sm:inline">
          Exemple <strong>{template.name}</strong>
        </span>
        <Link href="/exemples" className="btn btn-ghost btn-sm">
          ← Exemples
        </Link>
        <Link href="/#contact" className="btn btn-primary btn-sm">
          Un site comme ça
        </Link>
      </aside>
    </>
  );
}
