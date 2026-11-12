"use client";

import { useActionState } from "react";
import { syncAction } from "@/app/actions/mailbox";
import type { FormState } from "@/app/actions/public";
import { RefreshIcon } from "./MailIcons";

/** Bouton rond « actualiser » (pictogramme seul) : va chercher les nouveaux messages. */
export default function SyncButton() {
  const [state, action, pending] = useActionState<FormState, FormData>(() => syncAction(), undefined);
  const label = state?.error ?? (state?.ok ? "Boîte à jour" : "Actualiser la boîte mail");
  return (
    <form action={action}>
      <button
        className={`inline-flex size-9 items-center justify-center rounded-full border bg-ink-2 transition hover:bg-ink-3 disabled:opacity-60 ${state?.error ? "border-coral text-coral" : "border-line"}`}
        title={label}
        aria-label={label}
        disabled={pending}
      >
        <RefreshIcon spin={pending} />
      </button>
    </form>
  );
}
