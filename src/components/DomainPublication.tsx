import { domainDns, serverIp } from "@/lib/domains";

/** État de publication d'un domaine : DNS relié au serveur ? site en ligne ? Un clic ouvre le site quand tout est prêt. */
export default async function DomainPublication({ name, siteStatus }: { name: string; siteStatus: string | null }) {
  const dns = await domainDns(name);
  const live = siteStatus === "live";
  const ready = dns.state === "ok" && live;
  return (
    <div className="flex flex-col items-start gap-1.5">
      {dns.state === "ok" && <span className="pill pill-ok">DNS relié</span>}
      {dns.state === "other" && (
        <span className="pill pill-warn" title={`Pointe vers ${dns.ips.join(", ")} au lieu de ${serverIp()}`}>
          DNS : autre serveur
        </span>
      )}
      {dns.state === "none" && <span className="pill pill-bad">DNS introuvable</span>}
      {siteStatus === null ? (
        <span className="pill pill-warn">Aucun site rattaché</span>
      ) : live ? (
        <span className="pill pill-ok">Site en ligne</span>
      ) : (
        <span className="pill pill-warn">Site pas en ligne</span>
      )}
      {ready && (
        <a href={`https://${name}`} target="_blank" rel="noopener" className="text-sm underline">
          Ouvrir ↗
        </a>
      )}
    </div>
  );
}

/** Mode d'emploi pour relier le nom de domaine d'un client à son site. */
export function DomainHelp({ admin = false }: { admin?: boolean }) {
  const ip = serverIp();
  return (
    <ol className="list-decimal space-y-2 pl-5 text-sm">
      <li>
        Chez le registrar du domaine, créer un enregistrement DNS de type <strong>A</strong> pour <code className="font-mono">@</code> vers{" "}
        <code className="font-mono">{ip || "l'adresse IP du serveur"}</code>, et un enregistrement <strong>CNAME</strong> pour{" "}
        <code className="font-mono">www</code> vers le nom de domaine lui-même.
      </li>
      <li>
        <strong>Ne pas supprimer</strong> les enregistrements MX et TXT existants : ils servent à la messagerie du domaine.
      </li>
      {admin && (
        <li>
          Ajouter le domaine ici en le rattachant au site, puis passer le site « En ligne ». Le certificat HTTPS est créé automatiquement à la
          première visite.
        </li>
      )}
      {!admin && <li>Prévenez-nous une fois fait : nous rattachons le domaine à votre site et le mettons en ligne.</li>}
      <li>La propagation du DNS peut prendre de quelques minutes à quelques heures.</li>
    </ol>
  );
}
