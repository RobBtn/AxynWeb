import Link from "next/link";
import { brand } from "@/lib/config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`} aria-label={`${brand.name} — accueil`}>
      <span className="grid size-8 place-items-center rounded-full border border-bone bg-accent text-on-accent">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 6l4.5 12L12 8l4.5 10L21 6" />
        </svg>
      </span>
      <span className="display text-xl">{brand.name}</span>
    </Link>
  );
}

export function Nav() {
  const links = [
    { href: "/modeles", label: "Modèles" },
    { href: "/#methode", label: "Méthode" },
    { href: "/#tarifs", label: "Tarifs" },
    { href: "/#contact", label: "Devis" },
  ];
  return (
    <header className="fixed inset-x-0 top-4 z-40 px-4">
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-bone bg-ink-2/90 py-2 pl-3 pr-2 shadow-[4px_4px_0_var(--color-bone)] backdrop-blur-md"
      >
        <Logo />
        <ul className="hidden items-center gap-1 text-sm md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="rounded-full px-4 py-2 transition-colors hover:bg-bone hover:text-ink">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/connexion" className="btn btn-dark btn-sm">
          Espace client
        </Link>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="zone-dark relative z-10 overflow-hidden px-6 pb-10 pt-24 md:px-10">
      <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <p className="display max-w-3xl text-5xl md:text-7xl">
          Votre site peut être en ligne <em>dans trois jours.</em>
        </p>
        <Link href="/#contact" className="btn btn-primary shrink-0" data-magnetic>
          Estimer mon site →
        </Link>
      </div>
      <p className="display mt-20 text-[clamp(4rem,21vw,22rem)] leading-[0.78] text-accent" aria-hidden="true">
        {brand.name}
      </p>
      <div className="mt-10 flex flex-col gap-6 border-t border-line pt-8 text-sm text-mute md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {brand.name}. Sites relus, sécurisés et tenus à jour.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <Link href="/mentions-legales" className="hover:text-bone">
              Mentions légales
            </Link>
          </li>
          <li>
            <Link href="/confidentialite" className="hover:text-bone">
              Confidentialité &amp; cookies
            </Link>
          </li>
          <li>
            <Link href="/cgv" className="hover:text-bone">
              CGV
            </Link>
          </li>
          <li>
            <Link href="/accessibilite" className="hover:text-bone">
              Accessibilité
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
