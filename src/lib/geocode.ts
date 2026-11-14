import "server-only";
import { all, run } from "./db";

/**
 * Géocodage des adresses de prospects avec le service public de la Géoplateforme (IGN, Base Adresse Nationale) :
 * gratuit, sans clé, hébergé en France. On n'envoie que l'adresse postale d'un commerce, jamais de donnée personnelle.
 *
 * Une adresse n'est géocodée qu'une fois : `geocoded_address` garde celle qui a été traitée. Si l'adresse change,
 * elle sera retraitée au prochain passage. La ville est remplie à partir du résultat si elle était vide.
 */
const ENDPOINT = "https://data.geopf.fr/geocodage/search";
const MIN_SCORE = 0.4;
let running = false;

type Feature = { geometry?: { coordinates?: [number, number] }; properties?: { city?: string; score?: number } };

/** « 12 rue X, 35000 Rennes » → « Rennes » (secours quand le géocodage échoue). */
export function cityFromAddress(address: string): string {
  const m = address.match(/\b\d{5}\s+([^,\d]+?)\s*(?:,|$)/);
  return m ? m[1].trim() : "";
}

async function geocodeOne(address: string): Promise<{ lat: number; lng: number; city: string } | null> {
  const url = `${ENDPOINT}?${new URLSearchParams({ q: address, limit: "1" })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`géocodage HTTP ${res.status}`);
  const f = ((await res.json()) as { features?: Feature[] }).features?.[0];
  const [lng, lat] = f?.geometry?.coordinates ?? [];
  if (typeof lat !== "number" || typeof lng !== "number" || (f?.properties?.score ?? 0) < MIN_SCORE) return null;
  return { lat, lng, city: f?.properties?.city ?? "" };
}

/** Traite les adresses nouvelles ou modifiées. Sans attente côté appelant : `void geocodeProspects()`. */
export async function geocodeProspects(max = 200) {
  if (running) return;
  running = true;
  try {
    const todo = all<{ id: string; address: string; city: string }>(
      "SELECT id, address, city FROM prospects WHERE address <> geocoded_address LIMIT ?",
      max
    );
    for (const p of todo) {
      if (!p.address) {
        run("UPDATE prospects SET lat = NULL, lng = NULL, geocoded_address = '' WHERE id = ?", p.id);
        continue;
      }
      let hit: Awaited<ReturnType<typeof geocodeOne>> = null;
      try {
        hit = await geocodeOne(p.address);
      } catch (e) {
        console.error("[axynweb] géocodage interrompu :", (e as Error).message);
        break; // service indisponible : on réessaiera au prochain passage
      }
      const city = p.city || hit?.city || cityFromAddress(p.address);
      run(
        "UPDATE prospects SET lat = ?, lng = ?, city = ?, geocoded_address = ? WHERE id = ?",
        hit?.lat ?? null,
        hit?.lng ?? null,
        city,
        p.address,
        p.id
      );
      await new Promise((r) => setTimeout(r, 120)); // limite du service : 50 requêtes/s, on reste très en dessous
    }
  } finally {
    running = false;
  }
}
