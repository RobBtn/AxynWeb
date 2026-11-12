"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  message: string;
  confirmLabel: string;
  /** Action destructrice : bouton de confirmation rouge. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Fenêtre de confirmation aux couleurs du site, à la place de la boîte native du navigateur.
 * Repose sur l'élément <dialog> : le focus reste dans la fenêtre, Échap l'annule, et le focus
 * revient sur le bouton d'origine à la fermeture. Le bouton « Annuler » a le focus au départ,
 * pour qu'un Entrée distrait ne valide pas une suppression.
 */
export default function ConfirmDialog({ message, confirmLabel, danger = false, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onCancel={(e) => {
        e.preventDefault(); // Échap : on laisse le parent fermer la fenêtre
        onCancel();
      }}
      // Un clic sur le fond assombri (donc sur le <dialog> lui-même, pas sur la carte) annule.
      onClick={(e) => {
        if (e.target === ref.current) onCancel();
      }}
    >
      <div className="glass rounded-2xl p-7 shadow-[6px_6px_0_var(--color-bone)] md:p-8">
        <p className="kicker">Confirmation</p>
        <h2 id={titleId} className="display mt-4 text-4xl">
          Vous confirmez ?
        </h2>
        <p id={textId} className="mt-4 text-bone/85">
          {message}
        </p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-ghost btn-sm" autoFocus onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className={`btn btn-sm ${danger ? "btn-danger-solid" : "btn-primary"}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
