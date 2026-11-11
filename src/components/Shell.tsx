import Link from "next/link";
import { logout } from "@/app/actions/public";
import { Logo } from "./SiteChrome";
import SideNav, { type NavItem } from "./SideNav";
import type { SessionUser } from "@/lib/auth";

/** Cadre commun aux espaces client et admin : barre latérale + contenu. */
export default function Shell({
  user,
  items,
  title,
  cta,
  children,
}: {
  user: SessionUser;
  items: NavItem[];
  title: string;
  /** Action principale de l'espace, toujours à portée de clic. */
  cta?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <div className="relative z-10 mx-auto flex max-w-[92rem] flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <aside className="flex shrink-0 flex-col gap-4 rounded-2xl border border-bone bg-ink-2 p-4 lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)] lg:w-64">
          <div className="flex items-center justify-between gap-3 px-1">
            <Logo />
            <span className="rounded-full bg-ink-3 px-2.5 py-1 font-mono text-[0.68rem]">{title}</span>
          </div>
          {cta && (
            <Link href={cta.href} className="btn btn-primary btn-sm w-full">
              {cta.label}
            </Link>
          )}
          <SideNav items={items} label={title} />
          <div className="flex items-center justify-between gap-3 border-t border-line pt-4 lg:mt-auto lg:flex-col lg:items-stretch">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-mute">{user.email}</p>
            </div>
            <form action={logout}>
              <button className="btn btn-ghost btn-sm w-full">Se déconnecter</button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 pt-2">
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="display mt-3 text-5xl md:text-6xl">{title}</h1>
      </div>
      {children}
    </header>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-2xl p-6 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

const tone: Record<string, string> = {
  live: "pill-ok",
  done: "pill-ok",
  won: "pill-ok",
  review: "pill-info",
  in_progress: "pill-info",
  contacted: "pill-info",
  brief: "pill-warn",
  new: "pill-warn",
  lost: "pill-bad",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={`pill ${tone[status] ?? ""}`}>{label}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-mute">{children}</p>;
}

export const frDate = (iso: string | null) =>
  iso ? new Date(iso.replace(" ", "T") + (iso.length > 10 ? "Z" : "")).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
