import Link from "next/link";
import type { TemplateDef } from "@/lib/templates";

/** Carte d'un modèle : vraie capture du site, nom et secteur dessous. */
export default function TemplateCard({ t, className = "" }: { t: TemplateDef; className?: string }) {
  return (
    <Link href={`/modeles/${t.id}`} data-cursor="Voir" className={`group flex shrink-0 flex-col ${className}`}>
      <div data-tilt className="relative flex-1 overflow-hidden rounded-xl border border-line" style={{ background: t.preview.bg }}>
        {/* Capture locale du modèle (public/previews) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/previews/${t.id}.jpg`}
          alt={`Aperçu du modèle ${t.name}`}
          loading="lazy"
          className="absolute inset-0 size-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-baseline justify-between gap-4 pt-4">
        <p className="display text-2xl">{t.name}</p>
        <p className="text-sm text-mute">{t.sector}</p>
      </div>
      <p className="mt-1 max-w-md text-sm text-mute">{t.pitch}</p>
    </Link>
  );
}
