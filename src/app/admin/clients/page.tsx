import ActionForm from "@/components/ActionForm";
import { Card, Empty, PageTitle, frDate } from "@/components/Shell";
import Link from "next/link";
import ProspectMap, { type MapPoint } from "@/components/ProspectMap";
import { createClientAction, deleteClientAction, resetClientPasswordAction, updateClientAddressAction } from "@/app/actions/admin";
import { requireUser } from "@/lib/auth";
import { listClients } from "@/lib/data";
import { geocodeProspects } from "@/lib/geocode";

const chip = (active: boolean) => `chip-h ${active ? "hue-green" : "hue-slate"}`;

export default async function AdminClients({ searchParams }: { searchParams: Promise<{ ville?: string; vue?: string }> }) {
  await requireUser("admin");
  void geocodeProspects();
  const { ville, vue } = await searchParams;
  const city = (ville ?? "").trim().slice(0, 80);
  const onMap = vue === "carte";
  const all = listClients();

  // Villes avec leur nombre de clients ; « - » désigne les clients sans ville.
  const counts = new Map<string, number>();
  for (const c of all) if (c.city) counts.set(c.city, (counts.get(c.city) ?? 0) + 1);
  const cities = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"));
  const withoutCity = all.filter((c) => !c.city).length;
  const clients = all.filter((c) => !city || (city === "-" ? !c.city : c.city.toLowerCase() === city.toLowerCase()));
  const points: MapPoint[] = clients
    .filter((c) => c.lat !== null && c.lng !== null)
    .map((c) => ({ id: c.id, name: c.company || c.name, activity: c.company ? c.name : "", phone: "", city: c.city, address: c.address, lat: c.lat!, lng: c.lng!, priority: "" }));
  const href = (o: { ville?: string; vue?: string }) => {
    const params = new URLSearchParams();
    const v = o.ville ?? city;
    const w = o.vue ?? (onMap ? "carte" : "");
    if (v) params.set("ville", v);
    if (w) params.set("vue", w);
    const qs = params.toString();
    return `/admin/clients${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageTitle kicker="Administration" title="Clients" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
            <Link href={href({ vue: "" })} className={chip(!onMap)} aria-current={!onMap ? "page" : undefined}>
              Liste
            </Link>
            <Link href={href({ vue: "carte" })} className={chip(onMap)} aria-current={onMap ? "page" : undefined}>
              Carte · {all.filter((c) => c.lat !== null).length}
            </Link>
            {(cities.length > 0 || city) && (
              <>
                <span className="ml-2 text-mute">Ville</span>
                <Link href={href({ ville: "" })} className={chip(!city)}>
                  Toutes
                </Link>
                {cities.map(([c, n]) => (
                  <Link key={c} href={href({ ville: c })} className={chip(city.toLowerCase() === c.toLowerCase())}>
                    {c} · {n}
                  </Link>
                ))}
                {withoutCity > 0 && (
                  <Link href={href({ ville: "-" })} className={chip(city === "-")}>
                    Sans ville · {withoutCity}
                  </Link>
                )}
              </>
            )}
          </div>
          {onMap ? (
            <>
              <ProspectMap points={points} legend={false} label="Carte des clients" />
              <p className="mt-3 text-sm text-mute">
                {points.length} client{points.length > 1 ? "s" : ""} sur la carte
                {clients.length > points.length && ` · ${clients.length - points.length} sans adresse reconnue (à renseigner dans la liste)`}.
              </p>
            </>
          ) : clients.length === 0 ? (
            <Empty>{city ? "Aucun client dans cette ville." : "Aucun client."}</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Sites</th>
                    <th>Depuis</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="block font-medium">{c.name}</span>
                        <span className="text-xs text-mute">
                          {c.email}
                          {c.company && ` · ${c.company}`}
                          {c.city && ` · ${c.city}`}
                        </span>
                        <details className="mt-2 text-xs">
                          <summary className="cursor-pointer select-none text-mute underline">{c.address ? c.address : "Ajouter l'adresse"}</summary>
                          <ActionForm action={updateClientAddressAction} submit="Enregistrer" variant="ghost" className="mt-2 flex flex-col gap-2">
                            <input type="hidden" name="id" value={c.id} />
                            <input className="input !py-2 text-sm" name="address" defaultValue={c.address} maxLength={200} placeholder="Adresse professionnelle" aria-label={`Adresse de ${c.name}`} />
                            <input className="input !py-2 text-sm" name="city" defaultValue={c.city} maxLength={80} placeholder="Ville (déduite de l'adresse)" aria-label={`Ville de ${c.name}`} />
                          </ActionForm>
                        </details>
                        {c.deletion_requested_at && (
                          <span className="pill pill-bad mt-2">suppression demandée le {frDate(c.deletion_requested_at)}</span>
                        )}
                      </td>
                      <td>{c.sites}</td>
                      <td>{frDate(c.created_at)}</td>
                      <td className="space-y-2 text-right">
                        <ActionForm action={resetClientPasswordAction} submit="Générer un accès" variant="ghost" confirm={`Générer un nouveau mot de passe pour ${c.name} ? L'ancien ne fonctionnera plus.`} className="flex flex-col items-end gap-2">
                          <input type="hidden" name="id" value={c.id} />
                        </ActionForm>
                        <ActionForm
                          action={deleteClientAction}
                          submit="Supprimer"
                          variant="danger"
                          confirm={`Supprimer définitivement le compte de ${c.name} et ses demandes ? Ses sites seront conservés, sans propriétaire.`}
                        >
                          <input type="hidden" name="id" value={c.id} />
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Nouveau client" className="h-fit">
          <ActionForm action={createClientAction} submit="Créer le compte" reset className="flex flex-col gap-3">
            <label className="field">
              Nom
              <input className="input" name="name" required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              E-mail
              <input className="input" type="email" name="email" required maxLength={120} />
            </label>
            <label className="field">
              Entreprise
              <input className="input" name="company" maxLength={120} />
            </label>
          </ActionForm>
          <p className="mt-4 text-xs text-mute">
            Un mot de passe provisoire est généré. Transmettez-le au client par un canal sûr ; il pourra le changer dans
            son espace.
          </p>
        </Card>
      </div>
    </>
  );
}
