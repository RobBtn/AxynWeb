"use client";

import { useActionState } from "react";
import { createSiteWithAiAction } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/public";

type ClientOption = { id: string; name: string; email: string };

/** Création en un champ : on décrit l'activité, l'IA choisit le modèle, nomme le site et rédige tout. */
export default function AiCreate({ ready, clients }: { ready: boolean; clients: ClientOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createSiteWithAiAction, undefined);

  return (
    <form action={action} className="zone-accent flex flex-col gap-4 rounded-2xl border border-bone p-6 md:p-8">
      <div>
        <p className="kicker">Le plus rapide</p>
        <h2 className="display mt-3 text-4xl md:text-5xl">Décrivez. L&apos;IA fait le site.</h2>
        <p className="mt-3 max-w-2xl text-mute">
          Une phrase suffit, ou collez le message du client. L&apos;IA choisit le modèle, trouve le nom et rédige tous
          les textes. Il ne vous reste qu&apos;à relire et ajouter les photos.
        </p>
      </div>
      <label className="field">
        Description de l&apos;activité
        <textarea
          className="input min-h-32"
          name="brief"
          required
          minLength={10}
          maxLength={6000}
          disabled={!ready || pending}
          placeholder="Boulangerie artisanale à Tours, pain au levain et viennoiseries maison, ouverte du mardi au dimanche. Tél. 02 47 00 00 00."
        />
      </label>
      {clients.length > 0 && (
        <label className="field">
          Client (facultatif)
          <select className="input" name="client" defaultValue="" disabled={!ready || pending}>
            <option value="">— Attribuer plus tard —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button className="btn btn-primary" disabled={!ready || pending}>
          {pending ? "L'IA rédige le site… (20 à 40 s)" : "Créer le site avec l'IA →"}
        </button>
        <p role="status" className="text-sm">
          {state?.error ?? ""}
        </p>
      </div>
      {!ready && (
        <p className="rounded-xl border border-bone p-4 text-sm">
          IA non configurée. Ajoutez votre clé dans <code className="font-mono">.env.local</code> (ligne{" "}
          <code className="font-mono">ANTHROPIC_API_KEY=…</code>), puis relancez le serveur.
        </p>
      )}
    </form>
  );
}
