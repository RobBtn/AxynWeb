"use client";

import { useEffect, useRef } from "react";

/**
 * Barre collée en bas de l'écran, qui s'efface quand on fait défiler vers le bas et revient dès qu'on remonte.
 *
 * Sur iPhone, Safari replie sa barre d'adresse au défilement vers le bas, mais laisse les éléments fixes
 * à leur ancienne hauteur : un trou apparaît dessous, et aucun calcul de position ne le corrige. La barre
 * se retire donc pendant ce mouvement, exactement quand Safari replie la sienne, et réapparaît quand on
 * remonte (Safari réaffiche alors sa barre, le trou n'existe plus), en haut de page et en bas de page.
 */
export default function BottomDock({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const atTop = y < 80;
        const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 80;
        if (atTop || atEnd || y < last - 6) el.dataset.hidden = "false";
        else if (y > last + 6) el.dataset.hidden = "true";
        last = y;
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-hidden="false"
      className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out data-[hidden=true]:translate-y-[120%] ${className}`}
    >
      {children}
    </div>
  );
}
