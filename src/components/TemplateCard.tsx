import Link from "next/link";
import type { TemplateDef } from "@/lib/templates";

/**
 * Carte d'un exemple, à la manière des galeries de modèles des hébergeurs : sur ordinateur, la capture
 * bureau dans un cadre de navigateur ; sur téléphone, la capture mobile dans un cadre de téléphone,
 * pour que l'aperçu ne soit jamais rogné. Captures dans public/previews (<id>.jpg et <id>-mobile.jpg).
 */
export default function TemplateCard({ t, className = "" }: { t: TemplateDef; className?: string }) {
  return (
    <Link href={`/exemples/${t.id}`} data-cursor="Voir" className={`group flex shrink-0 flex-col ${className}`}>
      <div data-tilt className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-line bg-ink-3 p-2 md:flex-none md:rounded-xl md:p-0">
        <div className="hidden items-center gap-1.5 border-b border-line bg-ink-2 px-3 py-2 md:flex" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate rounded-md bg-ink px-3 py-0.5 font-mono text-[0.65rem] text-mute">{t.content.brand.toLowerCase().replace(/\s+/g, "-")}.fr</span>
        </div>
        <div className="relative flex-1 overflow-hidden rounded-[1.2rem] md:aspect-[16/10] md:flex-none md:rounded-none" style={{ background: t.preview.bg }}>
          <picture>
            <source media="(max-width: 767px)" srcSet={`/previews/${t.id}-mobile.jpg`} />
            { }
            <img
              src={`/previews/${t.id}.jpg`}
              alt={`Aperçu de l'exemple ${t.name}`}
              loading="lazy"
              className="absolute inset-0 size-full object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            />
          </picture>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-4 pt-4">
        <p className="display text-2xl">{t.name}</p>
        <p className="text-sm text-mute">{t.sector}</p>
      </div>
      <p className="mt-1 max-w-md text-sm text-mute">{t.pitch}</p>
    </Link>
  );
}
