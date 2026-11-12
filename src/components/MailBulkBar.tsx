"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { bulkMailAction } from "@/app/actions/mailbox";
import type { FormState } from "@/app/actions/public";
import ConfirmDialog from "./ConfirmDialog";

const FORM_ID = "mail-bulk";
const boxes = () => [...document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${FORM_ID}"]`)];

/**
 * Actions groupées de la messagerie. Chaque conversation de la liste porte une case `form="mail-bulk"` :
 * l'envoi emporte exactement les identifiants cochés. La suppression demande confirmation.
 */
export default function MailBulkBar({ folders }: { folders: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(bulkMailAction, undefined);
  const [count, setCount] = useState(0);
  const [asking, setAsking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const opRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLSelectElement>(null);

  const recount = useCallback(() => setCount(boxes().filter((b) => b.checked).length), []);

  useEffect(() => {
    const onChange = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLInputElement && t.getAttribute("form") === FORM_ID) recount();
    };
    document.addEventListener("change", onChange);
    const observer = new MutationObserver(recount);
    observer.observe(document.body, { childList: true, subtree: true });
    const first = requestAnimationFrame(recount);
    return () => {
      document.removeEventListener("change", onChange);
      observer.disconnect();
      cancelAnimationFrame(first);
    };
  }, [recount]);

  const submit = (op: string) => {
    if (opRef.current) opRef.current.value = op;
    formRef.current?.requestSubmit();
  };

  const setAll = (checked: boolean) => {
    boxes().forEach((b) => (b.checked = checked));
    recount();
  };

  return (
    <form
      id={FORM_ID}
      ref={formRef}
      action={action}
      className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-ink-3 px-3 py-2 text-sm"
      onSubmit={(e) => {
        if (count === 0) e.preventDefault();
      }}
    >
      <input ref={opRef} type="hidden" name="op" defaultValue="" />
      {asking && (
        <ConfirmDialog
          message={`Supprimer ${count} conversation${count > 1 ? "s" : ""} pour tous les administrateurs ? Les messages sont déplacés dans la corbeille de la messagerie.`}
          confirmLabel={`Supprimer ${count}`}
          danger
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            submit("delete");
          }}
        />
      )}
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" className="size-4 accent-accent" aria-label="Tout sélectionner" onChange={(e) => setAll(e.target.checked)} checked={count > 0 && count === boxes().length} />
        <span aria-live="polite">{count === 0 ? "Sélection" : `${count} sélectionnée${count > 1 ? "s" : ""}`}</span>
      </label>
      <button type="button" className="btn btn-ghost btn-sm" disabled={count === 0 || pending} onClick={() => submit("done")}>
        Marquer traitées
      </button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={count === 0 || pending} onClick={() => submit("open")}>
        Rouvrir
      </button>
      <select ref={folderRef} name="folder" className="input !w-auto !py-1.5 text-sm" aria-label="Dossier de destination" defaultValue="">
        <option value="">Sans dossier</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-ghost btn-sm" disabled={count === 0 || pending} onClick={() => submit("move")}>
        Classer
      </button>
      <button type="button" className="btn btn-danger btn-sm" disabled={count === 0 || pending} onClick={() => setAsking(true)}>
        Supprimer
      </button>
      {(state?.error || state?.message) && (
        <p role="status" className={`w-full text-xs ${state.error ? "text-coral" : "text-accent"}`}>
          {state.error ?? state.message}
        </p>
      )}
    </form>
  );
}
