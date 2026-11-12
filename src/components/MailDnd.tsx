"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mailActionAction } from "@/app/actions/mailbox";

const TYPE = "application/x-mail-ids";

/**
 * Glisser-déposer : une ligne de message (`data-mail-id`) se dépose sur un dossier (`data-drop-folder`).
 * Une valeur vide désigne « hors dossier » (Boîte de réception, Envoyés). Si le message glissé fait partie
 * des messages cochés, toute la sélection suit.
 */
export default function MailDnd() {
  const router = useRouter();
  const [, start] = useTransition();
  const [note, setNote] = useState("");

  useEffect(() => {
    const clearOver = () => document.querySelectorAll("[data-over]").forEach((e) => e.removeAttribute("data-over"));
    const target = (e: Event) => (e.target instanceof Element ? e.target.closest<HTMLElement>("[data-drop-folder]") : null);

    const onStart = (e: DragEvent) => {
      const row = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-mail-id]") : null;
      if (!row || !e.dataTransfer) return;
      const checked = [...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][form="mail-bulk"]:checked')].map((b) => b.value);
      const id = row.dataset.mailId ?? "";
      const ids = checked.includes(id) ? checked : [id];
      e.dataTransfer.setData(TYPE, JSON.stringify(ids));
      e.dataTransfer.setData("text/plain", `${ids.length} message${ids.length > 1 ? "s" : ""}`);
      e.dataTransfer.effectAllowed = "move";
      row.setAttribute("data-dragging", "");
    };
    const onEnd = () => {
      document.querySelectorAll("[data-dragging]").forEach((e) => e.removeAttribute("data-dragging"));
      clearOver();
    };
    const onOver = (e: DragEvent) => {
      const t = target(e);
      if (!t || !e.dataTransfer?.types.includes(TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!t.hasAttribute("data-over")) {
        clearOver();
        t.setAttribute("data-over", "");
      }
    };
    const onLeave = (e: DragEvent) => {
      const t = target(e);
      if (t && !(e.relatedTarget instanceof Node && t.contains(e.relatedTarget))) t.removeAttribute("data-over");
    };
    const onDrop = (e: DragEvent) => {
      const t = target(e);
      const raw = e.dataTransfer?.getData(TYPE);
      clearOver();
      if (!t || !raw) return;
      e.preventDefault();
      let ids: string[] = [];
      try {
        ids = JSON.parse(raw);
      } catch {
        return;
      }
      const fd = new FormData();
      fd.set("op", "move");
      fd.set("folder", t.dataset.dropFolder ?? "");
      ids.forEach((id) => fd.append("id", id));
      start(async () => {
        const res = await mailActionAction(undefined, fd);
        setNote(res?.error ?? res?.message ?? "");
        setTimeout(() => setNote(""), 3500);
        router.refresh();
      });
    };

    document.addEventListener("dragstart", onStart);
    document.addEventListener("dragend", onEnd);
    document.addEventListener("dragover", onOver);
    document.addEventListener("dragleave", onLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragstart", onStart);
      document.removeEventListener("dragend", onEnd);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragleave", onLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [router]);

  return note ? (
    <p role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-line bg-ink px-5 py-2.5 text-sm shadow-xl">
      {note}
    </p>
  ) : null;
}
