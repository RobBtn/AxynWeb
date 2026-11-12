import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = { title: "Accessibilité", alternates: { canonical: "/accessibilite" } };

export default function Accessibilite() {
  return (
    <LegalPage title="Accessibilité" updated="novembre 2026">
      <p>
        {brand.name} veut que ses sites soient utilisables par tous. Ce site n&apos;a pas encore fait l&apos;objet
        d&apos;un audit de conformité au RGAA : son état est « non audité ». Voici ce qui est déjà en place.
      </p>
      <h2>Ce que nous faisons</h2>
      <ul>
        <li>Les animations et la 3D sont désactivées si votre système demande de réduire les mouvements.</li>
        <li>Tout le contenu reste lisible sans la scène 3D, qui est purement décorative.</li>
        <li>Navigation complète au clavier, avec un indicateur de focus visible et un lien d&apos;accès direct au contenu.</li>
        <li>Structure de titres cohérente, formulaires étiquetés, messages d&apos;état annoncés aux lecteurs d&apos;écran.</li>
        <li>Contrastes de texte élevés sur fond sombre.</li>
      </ul>
      <h2>Signaler un problème</h2>
      <p>
        Si vous n&apos;arrivez pas à accéder à un contenu ou à un service, écrivez-nous à{" "}
        <a href={`mailto:${brand.email}`}>{brand.email}</a> : nous vous répondrons et chercherons une solution.
      </p>
    </LegalPage>
  );
}
