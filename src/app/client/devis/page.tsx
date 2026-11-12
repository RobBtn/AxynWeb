import Estimator from "@/components/Estimator";
import { PageTitle } from "@/components/Shell";
import { requireUser } from "@/lib/auth";

export default async function ClientQuote() {
  const user = await requireUser("client");
  return (
    <>
      <PageTitle kicker="Nouveau projet" title="Demander un devis" />
      <p className="mb-6 max-w-2xl text-sm text-mute">
        Réglez le simulateur pour voir une estimation, décrivez votre projet en quelques mots et envoyez. Nous revenons vers vous sous 24 h ouvrées ; le suivi
        de votre demande s&apos;affiche ensuite dans votre espace.
      </p>
      <Estimator defaults={{ name: user.name, email: user.email, company: user.company }} />
    </>
  );
}
