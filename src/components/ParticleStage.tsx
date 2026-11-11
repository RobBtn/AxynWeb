"use client";

import { useEffect, useRef } from "react";

/**
 * Fond 3D de l'accueil : 14 000 particules qui forment tour à tour six
 * paysages plein écran, chacun avec son mouvement propre :
 *   0 vague     nappe qui ondule vers l'horizon
 *   1 tunnel    on avance dans un couloir de points qui tourne
 *   2 ondes     cercles qui se propagent sur un plan
 *   3 rubans    cinq rubans qui serpentent à travers l'écran
 *   4 trame     réseau cubique que l'on traverse lentement
 *   5 galaxie   spirale en rotation différentielle
 *
 * C'est un fond, pas un objet : les particules prennent une teinte proche de
 * la couleur de la page, restent derrière le contenu et s'écartent sous le
 * curseur. Chaque section choisit son paysage par attributs :
 *   data-stage="2"            paysage visé
 *   data-stage-alpha="0.35"   opacité
 *   data-stage-bg="#164a36"   couleur du fond de page
 *   data-stage-ink="#cfe3c4"  couleur vers laquelle tendent les particules
 *
 * Sans WebGL ou avec « réduire les animations », rien ne s'active : les
 * sections gardent leur fond CSS normal.
 */
const COUNT = 14000;
const SHAPES = 6;
/** Part de la couleur d'encre dans la teinte des particules (le reste vient du fond). */
const INK_MIX = 0.8;

/** Générateur pseudo-aléatoire déterministe (même rendu à chaque visite). */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildShapes(): Float32Array[] {
  const rand = rng(7);
  const shapes = Array.from({ length: SHAPES }, () => new Float32Array(COUNT * 3));
  const set = (shape: number, i: number, x: number, y: number, z: number) => {
    shapes[shape][i * 3] = x;
    shapes[shape][i * 3 + 1] = y;
    shapes[shape][i * 3 + 2] = z;
  };

  // 0 — vague : nappe horizontale qui file vers l'horizon.
  const cols = 175;
  const rows = COUNT / cols;
  for (let i = 0; i < COUNT; i++) {
    const cx = (i % cols) / (cols - 1);
    const cz = Math.floor(i / cols) / (rows - 1);
    set(0, i, (cx - 0.5) * 22, -1.5, 3.5 - cz * 15);
  }

  // 1 — tunnel : parois ovales autour de l'axe du regard, centre dégagé pour le texte.
  for (let i = 0; i < COUNT; i++) {
    const a = rand() * Math.PI * 2;
    const z = 4 - rand() * 18;
    const r = 2.5 + rand() * rand() * 1.6;
    set(1, i, Math.cos(a) * r * 1.75, Math.sin(a) * r, z);
  }

  // 2 — ondes : disque de points, les cercles sont animés dans le shader.
  for (let i = 0; i < COUNT; i++) {
    const r = Math.sqrt(rand()) * 11;
    const a = rand() * Math.PI * 2;
    set(2, i, Math.cos(a) * r, -1.5, Math.sin(a) * r - 4);
  }

  // 3 — rubans : cinq bandes étagées en profondeur.
  for (let i = 0; i < COUNT; i++) {
    const j = i % 5;
    set(3, i, (rand() - 0.5) * 24, (j - 2) * 0.95 + (rand() - 0.5) * 0.22, -1.5 - j * 1.4 + (rand() - 0.5) * 0.1);
  }

  // 4 — trame : réseau cubique régulier (30 × 22 × 21 nœuds).
  const NX = 30, NY = 22, NZ = 21, STEP = 0.8;
  for (let i = 0; i < COUNT; i++) {
    const n = i % (NX * NY * NZ);
    const ix = n % NX;
    const iy = Math.floor(n / NX) % NY;
    const iz = Math.floor(n / (NX * NY));
    set(4, i, (ix - (NX - 1) / 2) * STEP, (iy - (NY - 1) / 2) * STEP, 2 - iz * STEP);
  }

  // 5 — galaxie spirale à trois bras, à plat (inclinée dans le shader).
  for (let i = 0; i < COUNT; i++) {
    const r = Math.pow(rand(), 0.6) * 7.5;
    const arm = Math.floor(rand() * 3);
    const a = r * 0.7 + (arm * Math.PI * 2) / 3 + (rand() - 0.5) * (1.0 - r * 0.07);
    set(5, i, Math.cos(a) * r, (rand() - 0.5) * 0.5 * (1.2 - r / 7.5), Math.sin(a) * r);
  }
  return shapes;
}

const VERTEX = /* glsl */ `
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec3 aP4;
attribute vec3 aP5;
attribute vec3 aRnd;
uniform float uTime;
uniform float uShape;
uniform float uReveal;
uniform float uSize;
uniform float uAspect;
uniform vec2 uMouse;
uniform float uMouseOn;
varying float vFade;

// Chaque particule part à son tour : le changement de paysage déferle au lieu de glisser d'un bloc.
float seg(float i){
  float k = clamp(uShape - i, 0.0, 1.0);
  k = clamp(k * 1.45 - aRnd.x * 0.45, 0.0, 1.0);
  return k * k * (3.0 - 2.0 * k);
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main(){
  // 0 vague : houle croisée.
  vec3 p = position;
  p.y += sin(p.x * 0.55 + uTime * 0.6) * cos(p.z * 0.5 + uTime * 0.4) * 0.55;

  // 1 tunnel : les points viennent vers nous et reprennent au fond ; le couloir vrille.
  vec3 q1 = aP1;
  q1.z = mod(q1.z + uTime * 0.55 + 14.0, 18.0) - 14.0;
  q1.xy *= rot(uTime * 0.04 + q1.z * 0.07);

  // 2 ondes : cercles concentriques qui s'éloignent du centre.
  vec3 q2 = aP2;
  float r2 = length(q2.xz - vec2(0.0, -4.0));
  q2.y += sin(r2 * 1.5 - uTime * 1.2) * 0.4 * smoothstep(12.0, 2.0, r2);

  // 3 rubans : chaque bande serpente avec son propre déphasage.
  vec3 q3 = aP3;
  float ph = aP3.z * 1.3;
  q3.y += sin(q3.x * 0.45 + uTime * 0.5 + ph) * 0.75;
  q3.z += cos(q3.x * 0.3 + uTime * 0.32 + ph) * 0.7;

  // 4 trame : on traverse le réseau, qui se balance à peine.
  vec3 q4 = aP4;
  q4.z = mod(q4.z + uTime * 0.3 + 14.8, 16.8) - 14.8;
  q4.xy *= rot(sin(uTime * 0.09) * 0.07);

  // 5 galaxie : le cœur tourne plus vite que les bras.
  vec3 q5 = aP5;
  q5.xz *= rot(uTime * 0.16 / (0.5 + length(q5.xz)));
  q5.yz *= rot(1.08);
  q5.z -= 4.0;

  float k1 = seg(0.0), k2 = seg(1.0), k3 = seg(2.0), k4 = seg(3.0), k5 = seg(4.0);
  p = mix(p, q1, k1);
  p = mix(p, q2, k2);
  p = mix(p, q3, k3);
  p = mix(p, q4, k4);
  p = mix(p, q5, k5);

  // Pendant le changement, un souffle à peine : les formes se fondent sans nuage brouillon.
  float f = fract(uShape);
  p += (aRnd - 0.5) * sin(f * 3.14159) * step(0.001, f) * 0.45;

  // Entrée en scène : nuage dispersé qui se met en place.
  float r = clamp(uReveal * 1.4 - aRnd.z * 0.4, 0.0, 1.0);
  r = 1.0 - pow(1.0 - r, 3.0);
  p = mix((aRnd - 0.5) * 18.0, p, r);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  // Le curseur écarte doucement les particules proches (calcul en coordonnées écran).
  vec2 ndc = gl_Position.xy / gl_Position.w;
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float push = smoothstep(0.26, 0.0, length(d)) * uMouseOn;
  vec2 dir = normalize(d + vec2(0.0001));
  dir.x /= uAspect;
  ndc += dir * push * 0.1;
  gl_Position.xy = ndc * gl_Position.w;

  // Fondu au loin et tout près de la caméra : rien n'apparaît ni ne disparaît d'un coup.
  float depth = -mv.z;
  vFade = (1.0 - smoothstep(8.0, 19.0, depth)) * smoothstep(0.4, 2.6, depth) * r * (0.6 + aRnd.y * 0.4);
  gl_PointSize = min(uSize * (0.6 + aRnd.y * 0.9) / max(depth, 0.1), uSize * 0.2);
}`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;
varying float vFade;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  // Bord très doux : les points se fondent dans la page au lieu de s'y découper.
  gl_FragColor = vec4(uColor, uAlpha * vFade * smoothstep(0.5, 0.18, d));
}`;

type Target = { shape: number; alpha: number; bg: number[]; ink: number[] };

const hex = (value: string): number[] => {
  const v = value.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
};

export default function ParticleStage() {
  const mount = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    const bg = backdrop.current;
    if (!el || !bg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;
      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio, 1.75);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);

      const shapes = buildShapes();
      const rand = rng(99);
      const rnd = new Float32Array(COUNT * 3);
      for (let i = 0; i < rnd.length; i++) rnd[i] = rand();
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(shapes[0], 3));
      for (let s = 1; s < SHAPES; s++) geometry.setAttribute(`aP${s}`, new THREE.BufferAttribute(shapes[s], 3));
      geometry.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 3));

      const uniforms = {
        uTime: { value: 0 },
        uShape: { value: 0 },
        uReveal: { value: 0 },
        uSize: { value: 30 * dpr },
        uAspect: { value: 1 },
        uMouse: { value: new THREE.Vector2(9, 9) },
        uMouseOn: { value: 0 },
        uColor: { value: new THREE.Color("#12150d") },
        uAlpha: { value: 0.5 },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);

      // Lecture des réglages portés par les sections.
      const sections = [...document.querySelectorAll<HTMLElement>("[data-stage]")].map((node) => ({
        node,
        target: {
          shape: Number(node.dataset.stage),
          alpha: Number(node.dataset.stageAlpha ?? 0.4),
          bg: hex(node.dataset.stageBg ?? "#f3f0e6"),
          ink: hex(node.dataset.stageInk ?? "#12150d"),
        } satisfies Target,
      }));
      if (sections.length === 0) return;

      // À partir d'ici la scène prend la main sur les fonds de section.
      document.documentElement.classList.add("stage-on");
      const cur: Target = { ...sections[0].target, bg: [...sections[0].target.bg], ink: [...sections[0].target.ink] };
      let goal = sections[0].target;
      const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
      let mobile = false;

      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
        uniforms.uAspect.value = camera.aspect;
        mobile = w < 768;
        // Écran étroit : champ plus large pour voir le paysage, et points plus gros pour qu'ils restent visibles.
        camera.fov = mobile ? 62 : 40;
        camera.updateProjectionMatrix();
        uniforms.uSize.value = (mobile ? 36 : 30) * dpr;
      };
      const onMove = (e: PointerEvent) => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
        mouse.ton = 1;
      };
      const onLeave = () => (mouse.ton = 0);

      const startedAt = performance.now();
      let raf = 0;
      let last = startedAt;
      const frame = () => {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        const t = (now - startedAt) / 1000;

        // Section qui occupe le milieu de l'écran.
        const mid = window.innerHeight * 0.55;
        for (const s of sections) {
          const r = s.node.getBoundingClientRect();
          if (r.top <= mid && r.bottom > mid) {
            goal = s.target;
            break;
          }
        }

        const ease = 1 - Math.pow(0.004, dt); // lissage indépendant de la cadence
        const slow = 1 - Math.pow(0.05, dt);
        cur.shape += (goal.shape - cur.shape) * slow;
        if (Math.abs(goal.shape - cur.shape) < 0.002) cur.shape = goal.shape;
        cur.alpha += (goal.alpha - cur.alpha) * ease;
        for (let i = 0; i < 3; i++) {
          cur.bg[i] += (goal.bg[i] - cur.bg[i]) * ease;
          cur.ink[i] += (goal.ink[i] - cur.ink[i]) * ease;
        }
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        mouse.on += (mouse.ton - mouse.on) * 0.06;

        uniforms.uTime.value = t;
        uniforms.uShape.value = cur.shape;
        uniforms.uReveal.value = Math.min(t / 2.4, 1);
        // Position exacte du curseur (non lissée) : l'écartement se produit sous la souris, sans retard.
        uniforms.uMouse.value.set(mouse.tx, mouse.ty);
        uniforms.uMouseOn.value = mouse.on;
        uniforms.uAlpha.value = Math.min(cur.alpha * (mobile ? 1.2 : 1), 0.8);
        // Teinte des particules : entre la couleur de la page et l'encre, pour se fondre dans le fond.
        uniforms.uColor.value.setRGB(
          cur.bg[0] + (cur.ink[0] - cur.bg[0]) * INK_MIX,
          cur.bg[1] + (cur.ink[1] - cur.bg[1]) * INK_MIX,
          cur.bg[2] + (cur.ink[2] - cur.bg[2]) * INK_MIX
        );
        bg.style.backgroundColor = `rgb(${cur.bg.map((c) => Math.round(c * 255)).join(" ")})`;

        // Parallaxe : le regard suit à peine la souris, le décor glisse sans jamais bouger d'un coup.
        camera.position.set(mouse.x * 0.45, 0.5 + mouse.y * 0.28, 7);
        camera.lookAt(mouse.x * 0.1, 0, -2);

        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };

      resize();
      frame();
      const ro = new ResizeObserver(resize);
      ro.observe(el);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        document.removeEventListener("visibilitychange", onVisibility);
        document.documentElement.classList.remove("stage-on");
        bg.style.backgroundColor = "";
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) cleanup();
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <>
      <div ref={backdrop} aria-hidden="true" className="stage-backdrop pointer-events-none fixed inset-0 z-0" />
      <div ref={mount} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />
    </>
  );
}
