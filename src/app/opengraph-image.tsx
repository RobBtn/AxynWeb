import { ImageResponse } from "next/og";
import { brand, pricing } from "@/lib/config";
import { area } from "@/lib/seo";

/** Image d'aperçu des liens partagés (réseaux, messageries, résultats enrichis), aux couleurs du site. */
export const alt = `${brand.name} — création de site internet à ${area.mainCity}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f3f0e6", color: "#164a36" }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 4, textTransform: "uppercase" }}>{brand.name} · Studio web</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, lineHeight: 1.02, fontWeight: 700 }}>
          <span>Création de site internet</span>
          <span>à {area.mainCity}.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 30 }}>
          <span>Sites 3D sécurisés · En ligne en 72 h</span>
          <span style={{ display: "flex", background: "#164a36", color: "#f3f0e6", borderRadius: 999, padding: "14px 32px" }}>
            Dès {pricing.offers[0].price} €
          </span>
        </div>
      </div>
    ),
    size,
  );
}
