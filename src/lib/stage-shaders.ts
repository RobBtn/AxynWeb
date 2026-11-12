/**
 * Shaders du fond 3D (voir src/components/Stage3D.tsx) : une surface unique, douce, qui change de forme.
 * Tout reste proche de la couleur de la page (uBg) ; l'encre (uInk) sert à moduler la lumière et à
 * tracer de fines courbes de niveau. Au loin, tout se fond dans la page (brume).
 */

export const COMMON = /* glsl */ `
uniform vec3 uBg;
uniform vec3 uInk;
uniform float uStrength;
uniform float uTime;
uniform float uScroll;
uniform vec2 uFog;
uniform float uAppear;

// Mélange entre le fond et l'encre ; k = contraste voulu (0 = invisible, 1 = encre pleine).
vec3 tone(float k){ return mix(uBg, uInk, clamp(k * uStrength, 0.0, 1.0)); }
// Brume au loin + apparition en douceur.
vec3 finish(vec3 col, float depth){
  col = mix(col, uBg, smoothstep(uFog.x, uFog.y, depth));
  return mix(uBg, col, smoothstep(0.03, 0.6, uAppear));
}
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * vnoise(p); p = p * 2.03 + vec2(13.1, 7.7); a *= 0.5; }
  return v;
}
float stroke(float d, float w){ return 1.0 - smoothstep(0.0, max(w, 1e-4), d); }
`;

/** Six formes, mélangées selon les poids uW[0..5] : le passage de l'une à l'autre est continu. */
export const SURFACE_VERT = /* glsl */ `
${COMMON}
uniform float uW[6];
varying vec3 vN;
varying vec3 vW;
varying float vH;
varying float vDepth;

float sDunes(vec2 q){                       // 0 · grandes dunes
  float a = fbm(q * vec2(0.020, 0.032) + 3.0);
  float b = fbm(q * vec2(0.060, 0.080));
  return a * 11.0 + b * 2.0 - 5.0;
}
float sSwell(vec2 q){                       // 1 · houle calme
  return sin(q.x * 0.11 + q.y * 0.07 + uTime * 0.35) * 1.6
       + sin(q.x * 0.05 - q.y * 0.13 - uTime * 0.27) * 1.2
       + sin(q.y * 0.21 + uTime * 0.2) * 0.5;
}
float sSilk(vec2 q){                        // 2 · étoffe aux grands plis
  float w = q.x * 0.11 + sin(q.y * 0.09 + uTime * 0.22) * 1.8;
  return sin(w) * 3.2 + sin(q.y * 0.07 + q.x * 0.04 + uTime * 0.15) * 2.2 + sin(w * 2.1 + q.y * 0.15) * 0.6;
}
float sTerraces(vec2 q){                    // 3 · terrasses aux paliers arrondis
  float s = sDunes(q) / 1.6;
  return (floor(s) + smoothstep(0.2, 0.8, fract(s))) * 1.6;
}
float sRipples(vec2 p){                     // 4 · ondes qui s'étalent depuis un point
  float r = length(p - vec2(0.0, -55.0));
  return sin(r * 0.30 - uTime * 0.7 - uScroll * 0.006) * 1.7 * smoothstep(120.0, 8.0, r) + fbm(p * 0.03) * 1.5;
}
float sCalm(vec2 q){                        // 5 · étendue presque plate
  return fbm(q * 0.025) * 3.0 + sin(q.x * 0.07 + uTime * 0.2) * 0.5;
}
float heightAt(vec2 p){
  vec2 q = vec2(p.x, p.y - uScroll * 0.007 - uTime * 0.2);   // le paysage vient à nous quand on descend dans la page
  float h = 0.0;
  if (uW[0] > 0.002) h += uW[0] * sDunes(q);
  if (uW[1] > 0.002) h += uW[1] * sSwell(q);
  if (uW[2] > 0.002) h += uW[2] * sSilk(q);
  if (uW[3] > 0.002) h += uW[3] * sTerraces(q);
  if (uW[4] > 0.002) h += uW[4] * sRipples(p);
  if (uW[5] > 0.002) h += uW[5] * sCalm(q);
  return h;
}
void main(){
  float grow = smoothstep(0.0, 1.0, uAppear);
  vec2 p = position.xz;
  float e = 0.9;
  float h = heightAt(p);
  float hx = heightAt(p + vec2(e, 0.0));
  float hz = heightAt(p + vec2(0.0, e));
  vN = normalize(vec3((h - hx) * grow, e, (h - hz) * grow));
  vH = h;
  vec3 pos = vec3(p.x, h * grow - 4.0, p.y);
  vW = pos;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

export const SURFACE_FRAG = /* glsl */ `
${COMMON}
uniform float uLines;
varying vec3 vN;
varying vec3 vW;
varying float vH;
varying float vDepth;
void main(){
  vec3 n = normalize(vN);
  float diff = clamp(dot(n, normalize(vec3(0.4, 0.75, -0.5))), 0.0, 1.0);
  // Thème clair : l'ombre prend l'encre. Thème sombre (encre plus claire que le fond) : c'est la lumière.
  float dark = step(dot(uBg, vec3(0.3, 0.59, 0.11)), dot(uInk, vec3(0.3, 0.59, 0.11)));
  float k = mix(1.0 - diff, diff, dark);
  vec3 col = tone(0.08 + 0.46 * k);
  // Courbes de niveau fines mais bien lisibles.
  float c = vH * 0.5;
  float fr = fract(c);
  col = mix(col, tone(0.6), stroke(min(fr, 1.0 - fr), fwidth(c) * 1.3) * 0.65 * uLines);
  // Grain léger : évite les bandes dans les dégradés.
  col += (hash2(gl_FragCoord.xy) - 0.5) * 0.014;
  gl_FragColor = vec4(finish(col, vDepth), 1.0);
}`;
