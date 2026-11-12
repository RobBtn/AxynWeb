"use client";

import { useActionState, useState, useTransition } from "react";
import { resendSignupCode, verifySignup, type FormState } from "@/app/actions/public";

export default function VerifyForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifySignup, undefined);
  const [info, setInfo] = useState<FormState>(undefined);
  const [resending, startResend] = useTransition();

  return (
    <>
      <form action={action} className="mt-8 flex flex-col gap-4">
        <label className="field">
          Code reçu par e-mail
          <input
            className="input text-center font-mono text-2xl tracking-[0.5em]"
            name="code"
            inputMode="numeric"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            autoComplete="one-time-code"
            required
            autoFocus
            aria-describedby="code-help"
          />
        </label>
        <p id="code-help" className="text-xs text-mute">
          Code envoyé à <strong>{email}</strong>. Il est valable 15 minutes. Pensez à vérifier vos courriers indésirables.
        </p>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Vérification…" : "Créer mon compte"}
        </button>
        <p role="alert" className="min-h-5 text-sm text-coral">
          {state?.error ?? ""}
        </p>
      </form>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={resending}
          onClick={() => startResend(async () => setInfo(await resendSignupCode()))}
        >
          {resending ? "Envoi…" : "Renvoyer le code"}
        </button>
        <a href="/inscription" className="text-sm underline">
          Changer d&apos;adresse
        </a>
      </div>
      <p role="status" className={`mt-3 min-h-5 text-sm ${info?.error ? "text-coral" : "text-accent"}`}>
        {info?.error ?? info?.message ?? ""}
      </p>
    </>
  );
}
