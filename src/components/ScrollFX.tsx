"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Animations de défilement déclaratives. Il suffit de poser des attributs :
 *   data-split            titre révélé mot par mot
 *   data-scrub-text       paragraphe qui s'allume mot à mot pendant le défilement
 *   data-clip             cadre dévoilé par un volet (photos)
 *   data-cursor="Voir"    le curseur devient une pastille avec ce mot
 *   data-reveal           apparition (fondu + glissement) ; data-reveal="left|right|zoom"
 *   data-stagger          les enfants directs apparaissent en cascade
 *   data-parallax="0.3"   déplacement vertical lié au défilement
 *   data-hscroll          section qui défile à l'horizontale : [data-hscroll-pin] (bloc épinglé) > [data-hscroll-track]
 *   data-scrub-scale      zoom progressif lié au défilement
 *   data-counter="120"    compteur animé
 *   data-magnetic         bouton aimanté par le curseur
 * Sans JavaScript ou avec « réduire les animations », tout reste visible.
 */
export default function ScrollFX({ smooth = true }: { smooth?: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let revert = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const desktop = window.matchMedia("(min-width: 900px)").matches;
      let lenis: InstanceType<typeof Lenis> | null = null;
      let tick: ((time: number) => void) | null = null;
      if (smooth && desktop) {
        lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
        lenis.on("scroll", ScrollTrigger.update);
        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }

      const restore: (() => void)[] = [];
      const ctx = gsap.context(() => {
        // Titres mot par mot.
        document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
          const text = el.textContent ?? "";
          const original = el.innerHTML;
          restore.push(() => {
            el.innerHTML = original;
            el.removeAttribute("aria-label");
          });
          el.setAttribute("aria-label", text);
          el.innerHTML = text
            .split(/(\s+)/)
            .map((w) =>
              w.trim()
                ? `<span aria-hidden="true" class="split-word"><span class="split-inner">${w
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")}</span></span>`
                : " "
            )
            .join("");
          gsap.from(el.querySelectorAll(".split-inner"), {
            yPercent: 115,
            rotate: 4,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.045,
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        // Paragraphe qui « s'allume » mot à mot pendant qu'on le traverse.
        document.querySelectorAll<HTMLElement>("[data-scrub-text]").forEach((el) => {
          const text = el.textContent ?? "";
          const original = el.innerHTML;
          restore.push(() => {
            el.innerHTML = original;
            el.removeAttribute("aria-label");
          });
          el.setAttribute("aria-label", text);
          el.innerHTML = text
            .split(/(\s+)/)
            .map((w) =>
              w.trim() ? `<span aria-hidden="true" class="scrub-word">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>` : " "
            )
            .join("");
          gsap.to(el.querySelectorAll(".scrub-word"), {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 45%", scrub: 0.4 },
          });
        });

        // Cadres (photos, visuels) dévoilés par un volet, l'image se recadre en même temps.
        document.querySelectorAll<HTMLElement>("[data-clip]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(100% 0% 0% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }
          );
          const inner = el.firstElementChild;
          if (inner) {
            gsap.fromTo(
              inner,
              { scale: 1.25 },
              { scale: 1, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }
            );
          }
        });

        document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          const mode = el.dataset.reveal;
          gsap.from(el, {
            opacity: 0,
            y: mode === "left" || mode === "right" ? 0 : 48,
            x: mode === "left" ? -60 : mode === "right" ? 60 : 0,
            scale: mode === "zoom" ? 0.9 : 1,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((el) => {
          gsap.from(el.children, {
            opacity: 0,
            y: 56,
            duration: 0.95,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: "top 85%" },
          });
        });

        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || "0.2");
          gsap.fromTo(
            el,
            { y: 120 * speed },
            {
              y: -120 * speed,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        });

        document.querySelectorAll<HTMLElement>("[data-scrub-scale]").forEach((el) => {
          gsap.fromTo(
            el,
            { scale: 0.82, borderRadius: 48 },
            {
              scale: 1,
              borderRadius: 24,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 95%", end: "top 30%", scrub: true },
            }
          );
        });

        if (desktop) {
          document.querySelectorAll<HTMLElement>("[data-hscroll]").forEach((section) => {
            const track = section.querySelector<HTMLElement>("[data-hscroll-track]");
            // On épingle un bloc INTERNE à la section. Épingler la section elle-même la
            // déplacerait dans un conteneur GSAP, et React planterait (removeChild) en la retirant.
            const pinned = section.querySelector<HTMLElement>("[data-hscroll-pin]");
            if (!track || !pinned) return;
            const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
            // Galerie en profondeur : chaque carte pivote et recule selon sa distance au centre de l'écran.
            const cards = [...track.querySelectorAll<HTMLElement>("[data-depth]")];
            const depth = () => {
              const mid = window.innerWidth / 2;
              cards.forEach((card) => {
                const r = card.getBoundingClientRect();
                const off = Math.max(-1, Math.min(1, (r.left + r.width / 2 - mid) / window.innerWidth));
                gsap.set(card, {
                  rotateY: off * -32,
                  z: -Math.abs(off) * 260,
                  transformPerspective: 1400,
                  transformOrigin: "50% 50%",
                });
              });
            };
            gsap.to(track, {
              x: () => -distance(),
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => `+=${distance()}`,
                pin: pinned,
                scrub: 0.6,
                invalidateOnRefresh: true,
                onUpdate: depth,
                onRefresh: depth,
              },
            });
          });
        }

        document.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => {
          const end = parseFloat(el.dataset.counter || "0");
          const obj = { v: 0 };
          gsap.to(obj, {
            v: end,
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toLocaleString("fr-FR");
            },
          });
        });
      });

      // Curseur personnalisé : un point qui s'agrandit en pastille « Voir » sur [data-cursor].
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      let cursor: HTMLDivElement | null = null;
      let moveX: ((v: number) => void) | null = null;
      let moveY: ((v: number) => void) | null = null;
      if (desktop && fine) {
        cursor = document.createElement("div");
        cursor.className = "cursor";
        cursor.setAttribute("aria-hidden", "true");
        cursor.style.opacity = "0";
        document.body.appendChild(cursor);
        moveX = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
        moveY = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });
      }

      // Relief 3D : la carte survolée s'incline vers le curseur, puis revient à plat.
      let tilted: HTMLElement | null = null;
      const tilt = (target: HTMLElement | null, e: PointerEvent) => {
        const card = target?.closest<HTMLElement>("[data-tilt]") ?? null;
        if (tilted && tilted !== card) {
          gsap.to(tilted, { rotateX: 0, rotateY: 0, duration: 0.7, ease: "power3.out", overwrite: "auto" });
        }
        tilted = card;
        if (!card) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotateY: px * 14,
          rotateX: -py * 12,
          transformPerspective: 1000,
          duration: 0.5,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      // Boutons aimantés + curseur + relief.
      const onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        tilt(target, e);
        if (cursor && moveX && moveY) {
          cursor.style.opacity = "1";
          moveX(e.clientX);
          moveY(e.clientY);
          const label = target?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
          cursor.classList.toggle("is-label", !!label);
          cursor.textContent = label ?? "";
        }
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const r = btn.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          const near = Math.hypot(dx, dy) < 110;
          gsap.to(btn, { x: near ? dx * 0.28 : 0, y: near ? dy * 0.28 : 0, duration: 0.4, ease: "power3.out" });
        });
      };
      if (desktop) window.addEventListener("pointermove", onMove, { passive: true });

      const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

      revert = () => {
        window.clearTimeout(refresh);
        window.removeEventListener("pointermove", onMove);
        cursor?.remove();
        ctx.revert();
        restore.forEach((fn) => fn());
        if (tick) gsap.ticker.remove(tick);
        lenis?.destroy();
      };
      if (cancelled) revert();
    })();

    return () => {
      cancelled = true;
      revert();
    };
  }, [pathname, smooth]);

  return null;
}
