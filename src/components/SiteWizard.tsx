"use client";

import { useActionState, useState } from "react";
import { createSiteAction } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/public";

type TemplateOption = { id: string; name: string; sector: string; bg: string };
type ClientOption = { id: string; name: string; email: string };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="glass rounded-2xl p-6">
      <legend className="float-left mb-5 flex w-full items-center gap-3 text-lg font-semibold">
        <span className="grid size-8 place-items-center rounded-full border border-bone bg-accent font-mono text-sm text-on-accent">{n}</span>
        {title}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

/** Création de site guidée : point de départ, nom, client. Ouvre l'éditeur à la fin. */
export default function SiteWizard({ templates, clients }: { templates: TemplateOption[]; clients: ClientOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createSiteAction, undefined);
  const [start, setStart] = useState(templates[0]?.id ?? "brief");
  const [clientMode, setClientMode] = useState<"none" | "existing" | "new">(clients.length ? "existing" : "none");
  const [name, setName] = useState("");
  const isBrief = start === "brief";

  const choice = (active: boolean) =>
    `cursor-pointer rounded-xl border p-2 text-left transition ${
      active ? "border-bone shadow-[4px_4px_0_var(--color-accent)]" : "border-line hover:border-bone"
    }`;

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="mode" value={isBrief ? "brief" : "template"} />
      <input type="hidden" name="templateId" value={isBrief ? "" : start} />
      <input type="hidden" name="clientMode" value={clientMode} />

      <Step n={1} title="Point de départ">
        <div role="radiogroup" aria-label="Point de départ" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={start === t.id}
              onClick={() => setStart(t.id)}
              className={choice(start === t.id)}
            >
              <span className="relative block aspect-[4/3] overflow-hidden rounded-lg" style={{ background: t.bg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/previews/${t.id}.jpg`} alt="" className="absolute inset-0 size-full object-cover object-top" />
              </span>
              <span className="mt-2 block px-1 font-medium">{t.name}</span>
              <span className="block px-1 pb-1 text-xs text-mute">{t.sector}</span>
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={isBrief}
            onClick={() => setStart("brief")}
            className={choice(isBrief)}
          >
            <span className="zone-dark grid aspect-[4/3] place-items-center rounded-lg">
              <span className="display text-4xl text-accent">IA</span>
            </span>
            <span className="mt-2 block px-1 font-medium">Sur-mesure</span>
            <span className="block px-1 pb-1 text-xs text-mute">Généré depuis un brief</span>
          </button>
        </div>
      </Step>

      <Step n={2} title="Le site">
        <div className="grid gap-4">
          <label className="field">
            Nom du site ou de l&apos;entreprise
            <input
              className="input"
              name="name"
              required
              minLength={2}
              maxLength={80}
              placeholder="Boulangerie Dupont"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {isBrief && (
            <label className="field">
              Brief du client
              <textarea
                className="input min-h-36"
                name="brief"
                required
                minLength={20}
                maxLength={8000}
                placeholder="Activité, ton, couleurs, pages souhaitées, références…"
              />
              <span className="text-xs">Claude récupère ce brief via MCP, génère la page et la dépose pour validation.</span>
            </label>
          )}
        </div>
      </Step>

      <Step n={3} title="Le client">
        <div role="radiogroup" aria-label="Client" className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["existing", "Client existant"],
              ["new", "Nouveau client"],
              ["none", "Plus tard"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={clientMode === value}
              disabled={value === "existing" && clients.length === 0}
              onClick={() => setClientMode(value)}
              className={`btn btn-sm ${clientMode === value ? "btn-dark" : "btn-ghost"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {clientMode === "existing" && (
          <label className="field">
            Client
            <select className="input" name="client" required>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </label>
        )}
        {clientMode === "new" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="field">
              Nom
              <input className="input" name="clientName" required minLength={2} maxLength={80} />
            </label>
            <label className="field">
              E-mail
              <input className="input" type="email" name="clientEmail" required maxLength={120} />
            </label>
            <label className="field">
              Entreprise
              <input className="input" name="clientCompany" maxLength={120} defaultValue={name} key={name} />
            </label>
            <p className="text-xs text-mute sm:col-span-3">
              Le compte est créé sans accès. Générez ses identifiants depuis « Clients » quand le site est prêt.
            </p>
          </div>
        )}
        {clientMode === "none" && <p className="text-sm text-mute">Vous pourrez attribuer le site à un client depuis sa fiche.</p>}
      </Step>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-2xl border border-bone bg-ink-2 p-3 shadow-[4px_4px_0_var(--color-bone)]">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Création…" : isBrief ? "Enregistrer le brief →" : "Créer et ouvrir l'éditeur →"}
        </button>
        <p role="status" className="text-sm text-coral">
          {state?.error ?? ""}
        </p>
      </div>
    </form>
  );
}
