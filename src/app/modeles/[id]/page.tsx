import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TemplateSite from "@/components/templates/TemplateSite";
import { getTemplate } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTemplate((await params).id);
  return t ? { title: `Modèle ${t.name}`, description: t.pitch } : {};
}

/** Démonstration plein écran d'un modèle, avec une barre flottante pour revenir ou le choisir. */
export default async function TemplateDemo({ params }: Props) {
  const template = getTemplate((await params).id);
  if (!template) notFound();

  return (
    <>
      <TemplateSite template={template} content={template.content} />
      <aside
        aria-label="Démonstration"
        className="zone-dark fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line p-1.5 pl-5 text-sm shadow-2xl"
      >
        <span className="hidden whitespace-nowrap sm:inline">
          Modèle <strong>{template.name}</strong>
        </span>
        <Link href="/modeles" className="btn btn-ghost btn-sm">
          ← Galerie
        </Link>
        <Link href="/#contact" className="btn btn-primary btn-sm">
          Je le veux
        </Link>
      </aside>
    </>
  );
}
