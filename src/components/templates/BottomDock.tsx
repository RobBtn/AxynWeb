"use client";

import { useEffect, useRef } from "react";

/**
 * Conteneur collé au bas de la zone réellement visible de l'écran.
 *
 * Sur iPhone, Safari calcule « bottom: 0 » d'un élément fixe par rapport à une zone qui ne suit pas le
 * repli de ses barres : l'élément reste plus haut et laisse voir la page en dessous. Une fois le script
 * lancé, on ancre donc le conteneur en haut de l'écran et on le descend, à chaque défilement ou
 * redimensionnement, jusqu'au bas de visualViewport (la zone vraiment affichée).
 */
export default function BottomDock({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const vv = window.visualViewport;
    if (!el || !vv) return;
    let raf = 0;
    const place = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = vv.offsetTop + vv.height - el.offsetHeight;
        el.style.top = "0";
        el.style.bottom = "auto";
        el.style.transform = `translate3d(0, ${Math.round(y)}px, 0)`;
      });
    };
    place();
    vv.addEventListener("resize", place);
    vv.addEventListener("scroll", place);
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", place);
      vv.removeEventListener("scroll", place);
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, []);

  return (
    // Sans script (ou avant son lancement), position classique en bas de l'écran.
    <div ref={ref} className={`fixed inset-x-0 bottom-0 z-40 will-change-transform ${className}`}>
      {children}
    </div>
  );
}
