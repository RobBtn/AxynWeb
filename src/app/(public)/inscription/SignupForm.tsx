"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { startSignup, type FormState } from "@/app/actions/public";

export default function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(startSignup, undefined);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <label className="field">
        Nom
        <input className="input" name="name" required minLength={2} maxLength={80} autoComplete="name" />
      </label>
      <label className="field">
        E-mail
        <input className="input" type="email" name="email" required maxLength={120} autoComplete="email" />
      </label>
      <div className="field">
        <label htmlFor="password">Mot de passe (12 caractères minimum)</label>
        <div className="relative">
          <input
            id="password"
            className="input pr-28"
            type={visible ? "text" : "password"}
            name="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-controls="password"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-medium text-bone hover:bg-ink-3"
          >
            {visible ? "Masquer" : "Afficher"}
          </button>
        </div>
      </div>
      <label className="field">
        Confirmer le mot de passe
        <input className="input" type={visible ? "text" : "password"} name="confirm" required minLength={12} maxLength={200} autoComplete="new-password" />
      </label>

      {/* Pot de miel : invisible pour les personnes, rempli par les robots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Ne pas remplir
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--color-accent)]" />
        <span>
          J&apos;accepte que mon nom et mon e-mail soient utilisés pour gérer mon compte, comme décrit dans la{" "}
          <Link href="/confidentialite" className="underline">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      <button className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Envoi du code…" : "Recevoir mon code"}
      </button>
      <p role="alert" className="min-h-5 text-sm text-coral">
        {state?.error ?? ""}
      </p>
    </form>
  );
}
