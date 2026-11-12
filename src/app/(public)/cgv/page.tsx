import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { brand, pricing } from "@/lib/config";

export const metadata: Metadata = { title: "Conditions générales de vente" };

export default function Cgv() {
  return (
    // Ces conditions sont un modèle de base : à faire relire par un professionnel du droit, puis à adapter à l'activité.
    <LegalPage title="Conditions générales de vente" updated="novembre 2026">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions régissent les prestations de création, d&apos;hébergement et de maintenance de sites
        web fournies par {brand.name}
        {brand.legal.companyName && ` (${brand.legal.companyName})`} à ses clients, professionnels ou consommateurs.
      </p>

      <h2>2. Commande et devis</h2>
      <p>
        Toute prestation fait l&apos;objet d&apos;un devis écrit. La commande est ferme à réception du devis accepté.
        Les estimations affichées par le simulateur du site sont indicatives.
      </p>

      <h2>3. Prix et paiement</h2>
      <p>
        Les prix sont indiqués en euros. La création du site est facturée à la commande ou selon l&apos;échéancier du
        devis. L&apos;hébergement et la maintenance sont facturés {pricing.maintenanceMonthly} € par mois, sans
        engagement de durée, résiliables à tout moment avec effet à la fin du mois en cours.
      </p>

      <h2>4. Réalisation et usage de l&apos;IA</h2>
      <p>
        Les sites sont conçus avec l&apos;assistance d&apos;outils d&apos;intelligence artificielle, puis vérifiés par
        une personne. Le client fournit des contenus (textes, images, marques) dont il détient les droits et reste
        responsable de leur exactitude et de leur licéité.
      </p>

      <h2>5. Validation et retouches</h2>
      <p>
        Le client valide le site depuis son espace client. Le nombre de séries de retouches incluses est précisé au
        devis ; les demandes supplémentaires font l&apos;objet d&apos;un devis complémentaire.
      </p>

      <h2>6. Propriété</h2>
      <p>
        Après paiement complet, le client est propriétaire de ses contenus et dispose d&apos;un droit d&apos;usage du
        site livré. Le nom de domaine est enregistré au nom du client. {brand.name} conserve la propriété de ses
        modèles, composants et outils, réutilisables pour d&apos;autres clients.
      </p>

      <h2>7. Droit de rétractation (consommateurs)</h2>
      <p>
        Le consommateur dispose de 14 jours pour se rétracter d&apos;un contrat conclu à distance. Ce droit ne peut plus
        être exercé pour un contenu personnalisé dont l&apos;exécution a commencé avec son accord exprès avant la fin
        de ce délai.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        {brand.name} est tenue à une obligation de moyens. Sa responsabilité est limitée au montant payé par le client
        au cours des douze derniers mois, sauf faute lourde ou disposition légale impérative contraire.
      </p>

      <h2>9. Résiliation et réversibilité</h2>
      <p>
        À la fin du contrat, {brand.name} remet au client ses contenus dans un format courant et procède au transfert
        du nom de domaine.
      </p>

      <h2>10. Médiation et droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français.
        {brand.legal.mediator &&
          ` En cas de litige, le consommateur peut recourir gratuitement à un médiateur de la consommation : ${brand.legal.mediator}.`}
      </p>
    </LegalPage>
  );
}
