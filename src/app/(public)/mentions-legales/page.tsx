import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegales() {
  const l = brand.legal;
  // Les informations non renseignées dans config.ts ne sont pas affichées.
  const lines: React.ReactNode[] = [
    [l.companyName || brand.name, l.legalForm].filter(Boolean).join(" — "),
    l.address && `Siège : ${l.address}`,
    l.siret && `SIRET : ${l.siret}`,
    l.vat && `TVA : ${l.vat}`,
    <>
      Contact : <a href={`mailto:${brand.email}`}>{brand.email}</a>
      {brand.phone && ` — ${brand.phone}`}
    </>,
  ].filter(Boolean);

  return (
    <LegalPage title="Mentions légales" updated="novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </p>
      {l.director && (
        <>
          <h2>Directeur de la publication</h2>
          <p>{l.director}</p>
        </>
      )}
      {l.host && (
        <>
          <h2>Hébergement</h2>
          <p>{l.host}</p>
        </>
      )}
      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, visuels, modèles, animations et le code de ce site sont la propriété de {brand.name}, sauf mention
        contraire. Toute reproduction sans autorisation écrite est interdite.
      </p>
      <h2>Usage de l&apos;intelligence artificielle</h2>
      <p>
        Les sites que nous réalisons sont conçus avec l&apos;assistance d&apos;outils d&apos;intelligence artificielle
        générative, puis relus et validés par une personne avant livraison. Nous l&apos;indiquons par souci de
        transparence envers nos clients et leurs visiteurs.
      </p>
      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans notre <a href="/confidentialite">politique de confidentialité</a>.
      </p>
    </LegalPage>
  );
}
