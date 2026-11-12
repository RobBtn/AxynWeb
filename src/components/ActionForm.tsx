"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/actions/public";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children?: React.ReactNode;
  submit: string;
  className?: string;
  variant?: "primary" | "ghost" | "danger";
  /** Message de confirmation avant envoi (suppression, etc.). */
  confirm?: string;
  /** Vide le formulaire après un succès. */
  reset?: boolean;
};

/** Formulaire relié à une Server Action : état d'envoi, erreurs, secret à usage unique. */
export default function ActionForm({ action, children, submit, className = "", variant = "primary", confirm, reset }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  // Confirmation : on interrompe l'envoi, on affiche la fenêtre, puis on renvoie le formulaire une fois validé.
  const [asking, setAsking] = useState(false);
  const confirmed = useRef(false);

  useEffect(() => {
    if (state?.ok && reset) ref.current?.reset();
  }, [state, reset]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !confirmed.current) {
          e.preventDefault();
          setAsking(true);
          return;
        }
        confirmed.current = false;
      }}
    >
      {asking && confirm && (
        <ConfirmDialog
          message={confirm}
          confirmLabel={submit}
          danger={variant === "danger"}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            confirmed.current = true;
            ref.current?.requestSubmit();
          }}
        />
      )}
      {children}
      <button className={`btn btn-sm btn-${variant} self-start`} disabled={pending}>
        {pending ? "…" : submit}
      </button>
      {(state?.error || state?.message) && (
        <p role="status" className={`text-sm ${state.error ? "text-coral" : "text-accent"}`}>
          {state.error ?? state.message}
        </p>
      )}
      {state?.secret && (
        <div className="flex flex-wrap items-center gap-2">
          <code className="select-all break-all rounded-lg bg-bone px-3 py-2 font-mono text-sm text-ink">{state.secret}</code>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(state.secret!);
              setCopied(true);
            }}
          >
            {copied ? "Copié ✓" : "Copier"}
          </button>
        </div>
      )}
    </form>
  );
}
