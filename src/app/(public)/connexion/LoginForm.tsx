"use client";

import { useActionState, useState } from "react";
import { login, type FormState } from "@/app/actions/public";

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <label className="field">
        E-mail
        <input className="input" type="email" name="email" required autoComplete="username" maxLength={120} />
      </label>
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <div className="relative">
          <input
            id="password"
            className="input pr-28"
            type={visible ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            maxLength={200}
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
      <button className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <p role="alert" className="min-h-5 text-sm text-coral">
        {state?.error ?? ""}
      </p>
    </form>
  );
}
