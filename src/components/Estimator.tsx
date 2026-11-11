"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { submitLead, type FormState } from "@/app/actions/public";
import { pricing } from "@/lib/config";

const euro = (n: number) => n.toLocaleString("fr-FR") + " €";

/** Simulateur de prix en direct + formulaire de demande de devis. */
export default function Estimator() {
  const sim = pricing.simulator;
  const [pages, setPages] = useState(1);
  const [options, setOptions] = useState<string[]>([]);
  const [state, action, pending] = useActionState<FormState, FormData>(submitLead, undefined);

  const total = useMemo(
    () =>
      sim.base +
      (pages - 1) * sim.perPage +
      sim.options.filter((o) => options.includes(o.id)).reduce((s, o) => s + o.price, 0),
    [pages, options, sim]
  );
  const summary = `${pages} page(s)${options.length ? " + " + sim.options.filter((o) => options.includes(o.id)).map((o) => o.label).join(", ") : ""} — estimation ${euro(total)}`;

  const toggle = (id: string) => setOptions((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="glass rounded-2xl p-8 md:p-10">
        <p className="kicker">Simulateur</p>
        <div className="mt-6 flex items-end justify-between gap-4">
          <span className="text-mute">Estimation</span>
          <output className="display text-7xl text-accent md:text-8xl" aria-live="polite">
            {euro(total)}
          </output>
        </div>

        <label className="mt-10 block">
          <span className="flex justify-between text-sm text-mute">
            <span>Nombre de pages</span>
            <span className="font-mono text-bone">{pages}</span>
          </span>
          <input
            type="range"
            min={1}
            max={12}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            className="mt-3 w-full accent-accent"
          />
        </label>

        <fieldset className="mt-8">
          <legend className="text-sm text-mute">Options</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sim.options.map((o) => {
              const on = options.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(o.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    on ? "border-bone bg-accent text-on-accent" : "border-line text-bone hover:border-bone"
                  }`}
                >
                  {o.label} <span className="opacity-60">+{o.price} €</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="mt-8 text-xs text-mute">
          Estimation indicative, hors taxes éventuelles. Maintenance et hébergement : {pricing.maintenanceMonthly} €/mois.
          Le devis final vous est confirmé par écrit.
        </p>
      </div>

      <form action={action} className="glass flex flex-col gap-4 rounded-2xl p-8 md:p-10">
        <p className="kicker">Demander un devis</p>
        <input type="hidden" name="estimate" value={summary} />
        {/* Pot de miel anti-robots */}
        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label>
            Site web
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            Nom
            <input className="input" name="name" required maxLength={80} autoComplete="name" />
          </label>
          <label className="field">
            E-mail
            <input className="input" type="email" name="email" required maxLength={120} autoComplete="email" />
          </label>
        </div>
        <label className="field">
          Entreprise (facultatif)
          <input className="input" name="company" maxLength={120} autoComplete="organization" />
        </label>
        <label className="field">
          Votre projet
          <textarea className="input min-h-28" name="message" required minLength={10} maxLength={3000} placeholder="Activité, style souhaité, délai…" />
        </label>
        <label className="flex items-start gap-3 text-xs text-mute">
          <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-accent" />
          <span>
            J&apos;accepte que mes données soient utilisées pour répondre à ma demande. Elles sont conservées 3 ans au
            plus et jamais revendues.{" "}
            <Link href="/confidentialite" className="underline">
              Politique de confidentialité
            </Link>
            .
          </span>
        </label>
        <button className="btn btn-primary mt-2" disabled={pending || state?.ok}>
          {pending ? "Envoi…" : state?.ok ? "Demande envoyée ✓" : "Envoyer ma demande"}
        </button>
        <p role="status" className={`min-h-5 text-sm ${state?.error ? "text-coral" : "text-accent"}`}>
          {state?.error ?? state?.message ?? ""}
        </p>
      </form>
    </div>
  );
}
