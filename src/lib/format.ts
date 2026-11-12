/** Date et heure d'un e-mail (ISO ou format SQLite) à l'heure de Paris : « 12 nov. 2026, 10:30 ». */
export function frMailDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
