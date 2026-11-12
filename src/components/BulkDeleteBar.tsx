"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { deleteProspectsAction } from "@/app/actions/admin";
import type { FormState } from "@/app/actions/public";
import ConfirmDialog from "./ConfirmDialog";

const FORM_ID = "bulk-delete";
const boxes = () => [...document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${FORM_ID}"]`)];

/**
 * Barre de sélection de la liste de prospects. Chaque fiche porte une case `form="bulk-delete"` : elles font toutes partie
 * de ce formulaire même si elles sont ailleurs dans la page, et l'envoi emporte donc exactement les identifiants cochés.
 * Une fenêtre de confirmation s'affiche avant toute suppression.
 */
export default function BulkDeleteBar() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteProspectsAction, undefined);
  const [count, setCount] = useState(0);
  const [asking, setAsking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);

  const recount = useCallback(() => setCount(boxes().filter((b) => b.checked).length), []);

  useEffect(() => {
    const onChange = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.getAttribute("form") === FORM_ID) recount();
    };
    document.addEventListener("change", onChange);
    // Après une suppression, la page se met à jour : les fiches supprimées disparaissent et le compteur suit.
    const observer = new MutationObserver(recount);
    observer.observe(document.body, { childList: true, subtree: true });
    const first = requestAnimationFrame(recount); // le navigateur peut restaurer des cases déjà cochées
    return () => {
      document.removeEventListener("change", onChange);
      observer.disconnect();
      cancelAnimationFrame(first);
    };
  }, [recount]);

  const setAll = (checked: boolean) => {
    boxes().forEach((b) => (b.checked = checked));
    recount();
  };

  return (
    <form
      id={FORM_ID}
      ref={formRef}
      action={action}
      className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-ink-3 px-4 py-3"
      onSubmit={(e) => {
        if (!confirmed.current) {
          e.preventDefault();
          if (count > 0) setAsking(true);
          return;
        }
        confirmed.current = false;
      }}
    >
      {asking && (
        <ConfirmDialog
          message={`Supprimer définitivement ${count} prospect${count > 1 ? "s" : ""} ? Cette action est irréversible.`}
          confirmLabel={`Supprimer ${count}`}
          danger
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            confirmed.current = true;
            formRef.current?.requestSubmit();
          }}
        />
      )}
      <span className="text-sm" aria-live="polite">
        {count === 0 ? "Aucune fiche sélectionnée" : `${count} fiche${count > 1 ? "s" : ""} sélectionnée${count > 1 ? "s" : ""}`}
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(true)}>
        Tout sélectionner
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAll(false)} disabled={count === 0}>
        Tout désélectionner
      </button>
      <button className="btn btn-danger btn-sm" disabled={count === 0 || pending}>
        {pending ? "…" : "Supprimer la sélection"}
      </button>
      {(state?.error || state?.message) && (
        <p role="status" className={`w-full text-sm ${state.error ? "text-coral" : "text-accent"}`}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}
