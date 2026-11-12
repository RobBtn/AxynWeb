"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFolderAction } from "@/app/actions/mailbox";
import type { FormState } from "@/app/actions/public";
import { FolderPlusIcon } from "./MailIcons";

/** Création d'un dossier : le panneau se déplie dans le volet et se referme tout seul une fois le dossier créé. */
export default function NewFolderPanel({ folders, defaultParent }: { folders: { id: string; label: string }[]; defaultParent: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createFolderAction, undefined);
  const details = useRef<HTMLDetailsElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      form.current?.reset();
      if (details.current) details.current.open = false;
    }
  }, [state]);

  // Un clic en dehors du panneau (ou la touche Échap) le referme.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const d = details.current;
      if (d?.open && e.target instanceof Node && !d.contains(e.target)) d.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && details.current?.open) details.current.open = false;
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <details ref={details} className="group border-t border-line pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2" title="Créer un dossier">
        <span className="font-mono text-[0.68rem] uppercase tracking-wider text-mute">Dossiers</span>
        <span className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-ink-2 transition group-hover:bg-ink-3 group-open:bg-ink-3" aria-label="Créer un dossier">
          <FolderPlusIcon />
        </span>
      </summary>
      <form ref={form} action={action} className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-ink-2 p-3">
        <label className="field">
          Nom du dossier
          <input className="input" name="name" maxLength={40} placeholder="Ex. Devis en cours" required />
        </label>
        <label className="field">
          Placer dans
          <select className="input" name="parent" defaultValue={defaultParent}>
            <option value="">Racine</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary btn-sm self-start" disabled={pending}>
          {pending ? "…" : "Créer le dossier"}
        </button>
        {state?.error && (
          <p role="status" className="text-sm text-coral">
            {state.error}
          </p>
        )}
      </form>
    </details>
  );
}
