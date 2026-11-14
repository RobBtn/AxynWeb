"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export type MapPoint = { id: string; name: string; activity: string; phone: string; city: string; address: string; lat: number; lng: number; priority: string };

const COLORS: Record<string, string> = { Haute: "#e0603f", Normale: "#2f6fd6", "À vérifier": "#d99a1e" };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Carte des prospects (Leaflet + tuiles OpenStreetMap). Un point par commerce géolocalisé, couleur selon la priorité. */
export default function ProspectMap({ points }: { points: MapPoint[] }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const bounds = L.latLngBounds([]);
      for (const p of points) {
        const color = COLORS[p.priority] ?? "#6b7280";
        L.circleMarker([p.lat, p.lng], { radius: 8, color: "#fff", weight: 2, fillColor: color, fillOpacity: 0.9 })
          .bindPopup(
            `<strong>${esc(p.name)}</strong><br>${esc([p.activity, p.city].filter(Boolean).join(" · "))}` +
              (p.address ? `<br><span style="opacity:.75">${esc(p.address)}</span>` : "") +
              (p.phone ? `<br><a href="tel:${esc(p.phone.replace(/\s/g, ""))}">${esc(p.phone)}</a>` : "")
          )
          .addTo(map);
        bounds.extend([p.lat, p.lng]);
      }
      if (points.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
      else map.setView([48.11, -1.68], 11); // Rennes
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  return (
    <div>
      <div ref={el} className="h-[min(70dvh,40rem)] w-full overflow-hidden rounded-2xl border border-line" role="region" aria-label="Carte des prospects" />
      <p className="mt-3 flex flex-wrap gap-4 text-xs text-mute">
        {Object.entries(COLORS).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-full border-2 border-white" style={{ background: color }} aria-hidden="true" />
            Priorité {label.toLowerCase()}
          </span>
        ))}
      </p>
    </div>
  );
}
