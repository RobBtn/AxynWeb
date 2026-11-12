"use client";

import { useEffect, useRef } from "react";
import type { BufferGeometry, ShaderMaterial } from "three";
import * as S from "@/lib/stage-shaders";

/**
 * Fond 3D du site vitrine : une seule surface, douce et lente, qui change de forme au fil de la page.
 *
 *   0 dunes   1 houle   2 soie   3 terrasses   4 ondes   5 calme
 *
 * Elle est vue de haut, éclairée en douceur, avec de fines courbes de niveau.
 * Le défilement pilote tout : le paysage vient vers nous quand on descend dans la page, et la surface se
 * transforme en continu d'une forme à la suivante quand on change de section (aucun objet, aucune coupure).
 * Chaque section choisit sa forme par attributs :
 *   data-stage="2"            forme visée
 *   data-stage-alpha="0.35"   intensité (plus bas = plus discret derrière le texte)
 *   data-stage-bg="#164a36"   couleur du fond de page
 *   data-stage-ink="#cfe3c4"  couleur de la lumière et des traits
 *
 * Pensé pour tous les appareils : une seule grille de points, plus légère sur mobile, champ de vision plus
 * large en portrait, résolution qui baisse d'elle-même si l'appareil peine, et canvas à la hauteur « grande
 * fenêtre » pour ne pas se redimensionner quand la barre d'adresse d'un téléphone apparaît ou disparaît.
 * Sans WebGL, ou avec « réduire les animations », rien ne s'active : les sections gardent leur fond CSS.
 */
const SHAPES = 6;
const FOG: [number, number] = [40, 165];
// Hauteur de la caméra pour chaque forme : plus haut sur les terrasses, plus bas sur le calme.
const CAM_Y = [7, 5.5, 6.5, 9, 8, 4.5];

type RGB = [number, number, number];
const hex = (value: string): RGB => {
  const v = value.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as RGB;
};
const clamp = (x: number, a = 0, b = 1) => Math.min(Math.max(x, a), b);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

type Section = { node: HTMLElement; stage: number; alpha: number; bg: RGB; ink: RGB; c: number };

export default function Stage3D() {
  const mount = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    const bgEl = backdrop.current;
    if (!el || !bgEl || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
      } catch {
        return; // WebGL indisponible : le fond CSS reste en place.
      }
      const canvas = renderer.domElement;
      const lite = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
      const maxDpr = Math.min(window.devicePixelRatio || 1, lite ? 1.75 : 2);
      let dpr = maxDpr;
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      // Sans cette contrainte, un canvas affiché sur un écran à forte densité de pixels (dpr 2 ou 3) prend la taille
      // de ses pixels réels, 2 à 3 fois trop grande : il déborde et le décor paraît zoomé et coupé.
      canvas.style.cssText = "display:block;width:100%;height:100%";
      el.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 260);

      // --- Lecture des réglages portés par les sections.
      const sections: Section[] = [...document.querySelectorAll<HTMLElement>("[data-stage]")].map((node) => ({
        node,
        stage: clamp(Math.round(Number(node.dataset.stage) || 0), 0, SHAPES - 1),
        alpha: Number(node.dataset.stageAlpha ?? 0.45),
        bg: hex(node.dataset.stageBg ?? "#f3f0e6"),
        ink: hex(node.dataset.stageInk ?? "#164a36"),
        c: 0,
      }));
      if (sections.length === 0) {
        renderer.dispose();
        canvas.remove();
        return;
      }

      // --- Uniformes de la surface.
      const weights = new Float32Array(SHAPES);
      weights[sections[0].stage] = 1;
      const shared = {
        uBg: { value: new THREE.Vector3(...sections[0].bg) },
        uInk: { value: new THREE.Vector3(...sections[0].ink) },
        uStrength: { value: 0.5 },
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uFog: { value: new THREE.Vector2(FOG[0], FOG[1]) },
        uAppear: { value: 0 },
      };
      const uniforms = { ...shared, uW: { value: weights }, uLines: { value: 1 } };

      const geometries: BufferGeometry[] = [];
      const materials: ShaderMaterial[] = [];

      // Surface : un plan tendu vers l'horizon, déformé dans le shader.
      const seg: [number, number] = lite ? [110, 100] : [190, 170];
      const plane = new THREE.PlaneGeometry(270, 230, seg[0], seg[1]);
      plane.rotateX(-Math.PI / 2);
      plane.translate(0, 0, -90);
      geometries.push(plane);
      const surfaceMat = new THREE.ShaderMaterial({ vertexShader: S.SURFACE_VERT, fragmentShader: S.SURFACE_FRAG, uniforms });
      materials.push(surfaceMat);
      const surface = new THREE.Mesh(plane, surfaceMat);
      surface.frustumCulled = false;
      scene.add(surface);

      // --- État animé.
      const cur = { alpha: sections[0].alpha, bg: [...sections[0].bg] as RGB, ink: [...sections[0].ink] as RGB, camY: CAM_Y[sections[0].stage] };
      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      let vw = 1;
      let vh = 1;

      const layout = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w === vw && h === vh) return;
        vw = w;
        vh = h;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        // Portrait : champ plus large, pour que le paysage ne soit pas coupé sur les côtés.
        camera.fov = camera.aspect < 0.9 ? 68 : 55;
        camera.updateProjectionMatrix();
      };

      // Qualité adaptative : si l'appareil peine, on baisse la résolution (jamais l'inverse, pour éviter les va-et-vient).
      const times: number[] = [];
      const watch = (ms: number) => {
        times.push(ms);
        if (times.length < 90) return;
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        times.length = 0;
        if (avg > 26 && dpr > 1) {
          dpr = Math.max(1, dpr * 0.8);
          renderer.setPixelRatio(dpr);
          renderer.setSize(vw, vh, false);
        }
      };

      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
      };

      const startedAt = performance.now();
      let last = startedAt;
      let raf = 0;
      let live = false; // une première image est rendue : la scène peut prendre la main sur les fonds CSS
      const goal = new Float32Array(SHAPES);

      const frame = () => {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const t = (now - startedAt) / 1000;
        watch(dt * 1000);
        layout();

        // Entre quelles sections se trouve le regard : tout est piloté par le défilement.
        const mid = window.innerHeight * 0.5;
        for (const s of sections) {
          const r = s.node.getBoundingClientRect();
          s.c = r.top + r.height / 2;
        }
        const next = sections.findIndex((s) => s.c > mid);
        let A = sections[sections.length - 1];
        let B = A;
        let u = 0;
        if (next === 0) {
          A = B = sections[0];
        } else if (next > 0) {
          A = sections[next - 1];
          B = sections[next];
          // La forme reste en place quand une section est bien centrée, et change surtout à la jonction.
          u = smooth(0.2, 0.8, (mid - A.c) / Math.max(B.c - A.c, 1));
        }
        goal.fill(0);
        goal[A.stage] += 1 - u;
        goal[B.stage] += u;

        const slow = 1 - Math.exp(-dt * 3.2); // la surface se transforme lentement : rien ne saute
        const quick = 1 - Math.exp(-dt * 8);
        let lines = 0;
        let camY = 0;
        for (let i = 0; i < SHAPES; i++) {
          weights[i] += (goal[i] - weights[i]) * slow;
          lines += weights[i] * (i === 0 || i === 3 ? 1 : 0.4);
          camY += weights[i] * CAM_Y[i];
        }
        cur.alpha += (lerp(A.alpha, B.alpha, u) - cur.alpha) * quick;
        for (let i = 0; i < 3; i++) {
          cur.bg[i] += (lerp(A.bg[i], B.bg[i], u) - cur.bg[i]) * quick;
          cur.ink[i] += (lerp(A.ink[i], B.ink[i], u) - cur.ink[i]) * quick;
        }
        cur.camY += (camY - cur.camY) * slow;
        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;

        const sy = window.scrollY;
        shared.uBg.value.set(cur.bg[0], cur.bg[1], cur.bg[2]);
        shared.uInk.value.set(cur.ink[0], cur.ink[1], cur.ink[2]);
        shared.uStrength.value = clamp(cur.alpha * 1.7, 0.45, 1.6);
        shared.uTime.value = t;
        shared.uScroll.value = sy;
        shared.uAppear.value = 1 - Math.pow(1 - clamp(t / 2), 3); // entrée en scène : le paysage monte doucement
        uniforms.uLines.value = lines;
        bgEl.style.backgroundColor = `rgb(${cur.bg.map((c) => Math.round(c * 255)).join(" ")})`;

        // Le regard glisse à peine : la souris et la page qui défile le font respirer.
        camera.position.set(mouse.x * 1.2 + Math.sin(t * 0.13) * 0.5, cur.camY + mouse.y * 0.6 + Math.sin(sy * 0.0007) * 0.5, 22);
        camera.lookAt(mouse.x * 0.8, 0.5, -45);

        renderer.render(scene, camera);
        if (!live) {
          live = true;
          document.documentElement.classList.add("stage-on");
        }
        raf = requestAnimationFrame(frame);
      };

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };

      // Contexte perdu (mémoire graphique saturée, mise en veille…) ou shader refusé : retour au fond CSS.
      const onLost = (e: Event) => {
        e.preventDefault();
        cleanup();
      };
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", onVisibility);
        canvas.removeEventListener("webglcontextlost", onLost);
        document.documentElement.classList.remove("stage-on");
        bgEl.style.backgroundColor = "";
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        renderer.dispose();
        canvas.remove();
      };
      canvas.addEventListener("webglcontextlost", onLost);
      renderer.debug.onShaderError = () => {
        console.error("[Stage3D] un shader a été refusé : retour au fond de page classique.");
        cleanup();
      };

      layout();
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      frame();
      if (disposed) cleanup();
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <>
      <div ref={backdrop} aria-hidden="true" className="stage-backdrop pointer-events-none fixed inset-x-0 top-0 z-0" style={{ height: "100lvh" }} />
      <div ref={mount} aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-0" style={{ height: "100lvh" }} />
    </>
  );
}
