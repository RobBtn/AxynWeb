"use client";

import { useState } from "react";
import Link from "next/link";

/** Menu du site vitrine sur téléphone : un bouton qui déroule les liens sous la barre. */
export default function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-mobile"
        onClick={() => setOpen((v) => !v)}
        className="grid size-10 place-items-center rounded-full border border-bone"
      >
        <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
        <span aria-hidden="true" className="relative block h-3 w-4">
          <span className={`absolute inset-x-0 top-0 h-0.5 bg-bone transition-transform ${open ? "translate-y-[5px] rotate-45" : ""}`} />
          <span className={`absolute inset-x-0 bottom-0 h-0.5 bg-bone transition-transform ${open ? "-translate-y-[5px] -rotate-45" : ""}`} />
        </span>
      </button>
      {open && (
        <ul
          id="menu-mobile"
          className="absolute inset-x-4 top-full mt-3 rounded-2xl border border-bone bg-ink-2 p-2 shadow-[4px_4px_0_var(--color-bone)]"
        >
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3.5 text-lg font-medium active:bg-ink-3">
                {l.label}
              </Link>
            </li>
          ))}
          <li className="p-2">
            <Link href="/connexion" onClick={() => setOpen(false)} className="btn btn-dark w-full">
              Espace client
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
