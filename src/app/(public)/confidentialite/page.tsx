import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { brand } from "@/lib/config";

export const metadata: Metadata = { title: "Confidentialité et cookies" };

export default function Confidentialite() {
  const l = brand.legal;
  return (
    <LegalPage title="Confidentialité & cookies" updated="novembre 2026">
      <p>
        Cette politique explique quelles données personnelles {brand.name} collecte, pourquoi, et comment exercer vos
        droits, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et
        Libertés.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {l.companyName}, {l.address}. Contact pour toute question relative à vos données :{" "}
        <a href={`mailto:${l.dpoEmail}`}>{l.dpoEmail}</a>.
      </p>

      <h2>Données collectées et finalités</h2>
      <ul>
        <li>
          <strong>Demande de devis</strong> — nom, e-mail, entreprise, message. Finalité : répondre à votre demande. Base
          légale : votre consentement et les mesures précontractuelles. Conservation : 3 ans après le dernier contact.
        </li>
        <li>
          <strong>Compte client</strong> — nom, e-mail, entreprise, mot de passe (stocké sous forme d&apos;empreinte
          irréversible), contenu de vos sites, demandes de modification. Finalité : exécution du contrat. Conservation :
          durée du contrat, puis 5 ans pour les pièces contractuelles et 10 ans pour les pièces comptables.
        </li>
        <li>
          <strong>Journal de sécurité</strong> — connexions et actions sensibles. Finalité : sécurité du service
          (intérêt légitime). Conservation : 12 mois.
        </li>
      </ul>

      <h2>Destinataires et hébergement</h2>
      <p>
        Vos données sont accessibles uniquement à {brand.name} et à son hébergeur, situé dans l&apos;Union européenne.
        Elles ne sont ni vendues, ni louées, ni transférées hors de l&apos;Union européenne.
      </p>
      <p>
        Nos sites sont créés avec l&apos;assistance d&apos;outils d&apos;intelligence artificielle. Les éléments que
        vous nous transmettez pour créer votre site (brief, textes) peuvent être traités par notre prestataire
        d&apos;IA, dans le cadre d&apos;un contrat de sous-traitance conforme au RGPD. Nous ne lui transmettons aucune
        donnée sensible.
      </p>

      <h2>Cookies</h2>
      <p>
        Ce site n&apos;utilise <strong>aucun cookie publicitaire ni de mesure d&apos;audience</strong>. Un seul cookie
        est déposé, uniquement si vous vous connectez à l&apos;espace client :
      </p>
      <ul>
        <li>
          <code>wc_session</code> — cookie de session strictement nécessaire, durée 7 jours. Il est exempté de
          consentement.
        </li>
      </ul>
      <p>Votre navigateur garde aussi en mémoire que vous avez lu le bandeau d&apos;information (stockage local, sans identifiant).</p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez des droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et
        de portabilité. Depuis votre espace client, vous pouvez télécharger vos données et demander la suppression de
        votre compte. Vous pouvez aussi écrire à <a href={`mailto:${l.dpoEmail}`}>{l.dpoEmail}</a> : nous répondons sous
        un mois.
      </p>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL :{" "}
        <a href="https://www.cnil.fr/fr/plaintes" rel="noopener noreferrer" target="_blank">
          cnil.fr/fr/plaintes
        </a>
        .
      </p>

      <h2>Sécurité</h2>
      <p>
        Connexion chiffrée (HTTPS), mots de passe hachés, sessions protégées, cloisonnement des espaces clients,
        politique de sécurité du contenu stricte et journalisation des accès.
      </p>
    </LegalPage>
  );
}
