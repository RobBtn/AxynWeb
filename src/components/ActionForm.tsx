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
      {state?.secret && <CopyBox label={state.secretLabel} value={state.secret} />}
      {state?.extras?.map((x) => (
        <CopyBox key={x.label} label={x.label} value={x.value} />
      ))}
    </form>
  );
}

/** Valeur à copier (mot de passe provisoire, lien, commande…) avec son bouton « Copier ». */
function CopyBox({ label, value }: { label?: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-xs font-medium text-mute">{label}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <code className="select-all break-all rounded-lg bg-bone px-3 py-2 font-mono text-sm text-ink">{value}</code>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
            } catch {
              setCopied(false); // presse-papiers refusé : la valeur reste sélectionnable d'un clic (select-all)
            }
          }}
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
    </div>
  );
}
