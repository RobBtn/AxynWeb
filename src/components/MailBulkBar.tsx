"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { mailActionAction } from "@/app/actions/mailbox";
import type { FormState } from "@/app/actions/public";
import ConfirmDialog from "./ConfirmDialog";

const FORM_ID = "mail-bulk";
const boxes = () => [...document.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][form="${FORM_ID}"]`)];

/**
 * Barre d'actions de la liste de messages. Chaque ligne porte une case `form="mail-bulk"` : l'envoi emporte exactement
 * les messages cochés. La suppression demande confirmation.
 */
export default function MailBulkBar({ folders, openId, backHref }: { folders: { id: string; name: string }[]; openId?: string; backHref: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mailActionAction, undefined);
  const [count, setCount] = useState(0);
  const [asking, setAsking] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const opRef = useRef<HTMLInputElement>(null);

  const recount = useCallback(() => {
    const n = boxes().filter((b) => b.checked).length;
    setCount(n);
    if (n > 0) document.documentElement.setAttribute("data-mail-selecting", "");
    else document.documentElement.removeAttribute("data-mail-selecting");
  }, []);

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
      document.documentElement.removeAttribute("data-mail-selecting");
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
  // Sans case cochée, les actions visent le message ouvert (sélectionné dans la liste).
  const targets = count > 0 ? count : openId ? 1 : 0;
  const none = targets === 0 || pending;

  return (
    <form
      id={FORM_ID}
      ref={formRef}
      action={action}
      className={`flex-wrap items-center gap-1 rounded-xl bg-ink-3 px-2.5 py-2 text-sm ${targets === 0 ? "hidden" : "flex"}`}
      onSubmit={(e) => {
        if (targets === 0) e.preventDefault();
      }}
    >
      <input ref={opRef} type="hidden" name="op" defaultValue="" />
      <input type="hidden" name="from" value="reading" />
      <input type="hidden" name="back" value={backHref} />
      {openId && count === 0 && <input type="hidden" name="id" value={openId} />}
      {asking && (
        <ConfirmDialog
          message={`Supprimer ${targets} message${targets > 1 ? "s" : ""} ? ${targets > 1 ? "Ils sont déplacés" : "Il est déplacé"} dans la corbeille de la messagerie.`}
          confirmLabel={targets > 1 ? `Supprimer ${targets}` : "Supprimer"}
          danger
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            submit("delete");
          }}
        />
      )}
      <label className="mr-1 flex cursor-pointer items-center gap-2">
        <input type="checkbox" className="size-4 accent-accent" aria-label="Tout sélectionner" onChange={(e) => setAll(e.target.checked)} checked={count > 0 && count === boxes().length} />
        <span aria-live="polite" className="text-xs text-mute">
          {count === 0 ? "Message ouvert" : `${count} sél.`}
        </span>
      </label>
      <button type="button" className="btn btn-ghost !px-2.5 !py-1 !text-xs" disabled={none} onClick={() => submit("read")}>
        Lu
      </button>
      <button type="button" className="btn btn-ghost !px-2.5 !py-1 !text-xs" disabled={none} onClick={() => submit("unread")}>
        Non lu
      </button>
      <select name="folder" className="input !w-auto max-w-40 !px-2 !py-1 text-xs" aria-label="Dossier de destination" defaultValue="">
        <option value="">Sans dossier</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
      <button type="button" className="btn btn-ghost !px-2.5 !py-1 !text-xs" disabled={none} onClick={() => submit("move")}>
        Classer
      </button>
      <button type="button" className="btn btn-danger !px-2.5 !py-1 !text-xs" disabled={none} onClick={() => setAsking(true)}>
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
