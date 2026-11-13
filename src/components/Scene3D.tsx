"use client";

import { useEffect, useRef } from "react";

/**
 * Fonds 3D animés :
 *  - "silk"  : étoffe lumineuse qui ondule sur tout l'écran ;
 *  - "waves" : nappe de points qui roule vers l'horizon ;
 *  - "grid"  : relief filaire, façon plan d'architecte.
 */
export type ScenePreset = "silk" | "waves" | "grid";

type Props = {
  preset?: ScenePreset;
  /** Trois couleurs hexadécimales : creux, crêtes, reflets. */
  colors?: [string, string, string];
  /** Opacité globale du fond. */
  opacity?: number;
  /** Fond clair : mélange normal au lieu d'additif. */
  light?: boolean;
};

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

// Le relief est une hauteur z = h(x, y) : le défilement fait glisser le paysage.
const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
uniform float uScroll;
uniform float uPoint;
uniform float uDetail;
varying vec3 vViewPos;
varying vec3 vNormal;
varying float vH;
varying float vFade;
${NOISE}
float h(vec2 p){
  vec3 q = vec3(p * uFreq + vec2(uTime * 0.03, uScroll * 4.0), uTime * 0.07);
  return snoise(q) * (1.0 - uDetail) + snoise(q * 2.1 + 7.3) * uDetail;
}
void main(){
  float z = h(position.xy);
  float e = 0.06;
  float hx = h(position.xy + vec2(e, 0.0));
  float hy = h(position.xy + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - z) * uAmp / e, -(hy - z) * uAmp / e, 1.0));
  vNormal = normalize(normalMatrix * n);
  vH = z;
  vec4 mv = modelViewMatrix * vec4(position.xy, z * uAmp, 1.0);
  vViewPos = mv.xyz;
  vFade = 1.0 - smoothstep(9.0, 24.0, -mv.z);
  gl_PointSize = uPoint / max(-mv.z, 0.1);
  gl_Position = projectionMatrix * mv;
}`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uMode; // 0 étoffe, 1 points, 2 lignes
varying vec3 vViewPos;
varying vec3 vNormal;
varying float vH;
varying float vFade;
void main(){
  float t = smoothstep(-0.75, 0.75, vH);
  vec3 base = mix(uColorA, uColorB, t);
  if (uMode < 0.5) {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(-vViewPos);
    vec3 l = normalize(vec3(0.35, 0.75, 0.6));
    float diff = clamp(dot(n, l), 0.0, 1.0);
    float spec = pow(clamp(dot(reflect(-l, n), v), 0.0, 1.0), 9.0);
    float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
    vec3 col = base * (0.3 + 0.7 * diff) + uColorC * (spec * 0.32 + fres * 0.22);
    gl_FragColor = vec4(col, 1.0);
  } else if (uMode < 1.5) {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    vec3 col = mix(base, uColorC, smoothstep(0.45, 0.95, t));
    gl_FragColor = vec4(col, vFade * smoothstep(0.5, 0.15, d));
  } else {
    gl_FragColor = vec4(mix(base, uColorC, smoothstep(0.6, 1.0, t)), vFade * 0.75);
  }
}`;

/**
 * Arrière-plan WebGL plein écran. Le relief avance avec le défilement et
 * suit légèrement la souris. Respecte `prefers-reduced-motion` et se met en
 * pause quand l'onglet est masqué.
 */
export default function Scene3D({
  preset = "silk",
  colors = ["#1a1040", "#5b3bff", "#c8ff4d"],
  opacity = 1,
  light = false,
}: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const [c0, c1, c2] = colors;

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // WebGL indisponible : le fond CSS reste visible.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      // Sans cette contrainte, un canvas sur un écran à forte densité de pixels prend la taille de ses pixels réels
      // (2 à 3 fois trop grande) et déborde.
      renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);

      const cfg = {
        silk: { amp: 1.5, freq: 0.11, mode: 0, tilt: -0.62, y: 0, z: -2.5, point: 0 },
        waves: { amp: 1.0, freq: 0.2, mode: 1, tilt: -1.22, y: -2.1, z: -7, point: 30 },
        grid: { amp: 1.3, freq: 0.16, mode: 2, tilt: -1.2, y: -2.3, z: -7, point: 0 },
      }[preset];

      const uniforms = {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uAmp: { value: cfg.amp },
        uFreq: { value: cfg.freq },
        // L'étoffe n'a presque pas de détail fin : de grands plis lents, sans reflets nerveux.
        uDetail: { value: preset === "silk" ? 0.06 : 0.32 },
        uPoint: { value: cfg.point * renderer.getPixelRatio() },
        uMode: { value: cfg.mode },
        uColorA: { value: new THREE.Color(c0) },
        uColorB: { value: new THREE.Color(c1) },
        uColorC: { value: new THREE.Color(c2) },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
        transparent: cfg.mode !== 0,
        depthWrite: cfg.mode === 0,
        blending: cfg.mode !== 0 && !light ? THREE.AdditiveBlending : THREE.NormalBlending,
      });

      let geometry: import("three").BufferGeometry;
      let object: import("three").Object3D;
      if (preset === "silk") {
        geometry = new THREE.PlaneGeometry(34, 22, 240, 150);
        object = new THREE.Mesh(geometry, material);
      } else if (preset === "waves") {
        geometry = new THREE.PlaneGeometry(52, 34, 230, 150);
        object = new THREE.Points(geometry, material);
      } else {
        // Lignes du quadrillage dans les deux directions, finement subdivisées.
        const W = 56, H = 36, NX = 44, NY = 28, SUB = 4;
        const pts: number[] = [];
        for (let j = 0; j <= NY; j++) {
          const y = -H / 2 + (H * j) / NY;
          for (let i = 0; i < NX * SUB; i++) {
            pts.push(-W / 2 + (W * i) / (NX * SUB), y, 0, -W / 2 + (W * (i + 1)) / (NX * SUB), y, 0);
          }
        }
        for (let i = 0; i <= NX; i++) {
          const x = -W / 2 + (W * i) / NX;
          for (let j = 0; j < NY * SUB; j++) {
            pts.push(x, -H / 2 + (H * j) / (NY * SUB), 0, x, -H / 2 + (H * (j + 1)) / (NY * SUB), 0);
          }
        }
        geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        object = new THREE.LineSegments(geometry, material);
      }
      object.frustumCulled = false;
      object.rotation.x = cfg.tilt;
      object.position.set(0, cfg.y, cfg.z);
      scene.add(object);

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const state = { scroll: 0, target: 0, mx: 0, my: 0, tmx: 0, tmy: 0 };

      // Sur mobile, la hauteur visible change sans arrêt au défilement (barres du navigateur) : redimensionner
      // le canvas l'efface à chaque fois, d'où un clignotement. Le conteneur prend donc la plus grande hauteur
      // possible (100lvh), on ignore les petites variations de hauteur, et on redessine aussitôt après.
      let size = { w: 0, h: 0 };
      const resize = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w === size.w && Math.abs(h - size.h) < 160) return;
        size = { w, h };
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        state.target = max > 0 ? window.scrollY / max : 0;
      };
      const onMouse = (e: PointerEvent) => {
        state.tmx = (e.clientX / window.innerWidth) * 2 - 1;
        state.tmy = (e.clientY / window.innerHeight) * 2 - 1;
      };

      const startedAt = performance.now();
      let raf = 0;
      const frame = () => {
        const t = (performance.now() - startedAt) / 1000;
        state.scroll += (state.target - state.scroll) * 0.06;
        state.mx += (state.tmx - state.mx) * 0.04;
        state.my += (state.tmy - state.my) * 0.04;
        const p = state.scroll;

        uniforms.uTime.value = t;
        uniforms.uScroll.value = p;
        uniforms.uAmp.value = cfg.amp * (1 + Math.sin(p * Math.PI) * 0.45);

        // Le défilement fait basculer le relief et lever la caméra ; la souris décale le regard.
        object.rotation.x = cfg.tilt + p * 0.22;
        object.rotation.z = Math.sin(p * Math.PI * 2) * 0.12 + (preset === "silk" ? p * 0.5 : 0);
        camera.position.set(state.mx * 0.5, 0.4 + p * 1.4 - state.my * 0.25, 6);
        camera.lookAt(state.mx * 0.15, cfg.y * 0.35, cfg.z);

        // Passé le héros, le fond s'estompe un peu pour laisser la priorité au contenu.
        const past = Math.min(p / 0.08, 1);
        el.style.opacity = String(opacity * (1 - 0.3 * past));

        renderer.render(scene, camera);
        if (!reduce) raf = requestAnimationFrame(frame);
      };

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden && !reduce) raf = requestAnimationFrame(frame);
      };

      resize();
      onScroll();
      state.scroll = state.target;
      frame();

      const ro = new ResizeObserver(() => {
        resize();
        if (reduce) frame();
      });
      ro.observe(el);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onMouse, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onMouse);
        document.removeEventListener("visibilitychange", onVisibility);
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
  }, [preset, c0, c1, c2, opacity, light]);

  return (
    <div
      ref={mount}
      aria-hidden="true"
      className="scene3d pointer-events-none fixed left-0 top-0 z-0 h-lvh w-full"
      style={{ opacity }}
    />
  );
}
