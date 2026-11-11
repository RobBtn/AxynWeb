"use client";

import { useActionState } from "react";
import { login, type FormState } from "@/app/actions/public";

export default function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <label className="field">
        E-mail
        <input className="input" type="email" name="email" required autoComplete="username" maxLength={120} />
      </label>
      <label className="field">
        Mot de passe
        <input className="input" type="password" name="password" required autoComplete="current-password" maxLength={200} />
      </label>
      <button className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <p role="alert" className="min-h-5 text-sm text-coral">
        {state?.error ?? ""}
      </p>
    </form>
  );
}
