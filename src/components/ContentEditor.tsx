"use client";

import { useActionState, useState } from "react";
import PhotoManager from "./PhotoManager";
import { saveContent } from "@/app/actions/client";
import type { FormState } from "@/app/actions/public";
import { contentFields, type SiteContent } from "@/lib/templates";

type Saved = (NonNullable<FormState> & { saves: number }) | undefined;

/**
 * Éditeur de site : photos, textes rangés par sections repliables, et aperçu
 * en direct (ordinateur ou mobile) rechargé après chaque enregistrement.
 */
export default function ContentEditor({ siteId, slug, content }: { siteId: string; slug: string; content: SiteContent }) {
  // `saves` compte les enregistrements réussis : il sert de clé pour recharger l'aperçu.
  const [state, action, pending] = useActionState<Saved, FormData>(async (prev, fd) => {
    const result = await saveContent(prev, fd);
    return { ...result, saves: (prev?.saves ?? 0) + (result?.ok ? 1 : 0) };
  }, undefined);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dirty, setDirty] = useState(false);
  const version = `${state?.saves ?? 0}-${photoVersion}`;
  const groups = [...new Set(contentFields.map((f) => f.group))];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,27rem)_1fr]">
      <div className="flex flex-col gap-4">
        <PhotoManager siteId={siteId} content={content} onChange={() => setPhotoVersion((v) => v + 1)} />

        <form
          action={(fd) => {
            setDirty(false);
            action(fd);
          }}
          onChange={() => setDirty(true)}
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="siteId" value={siteId} />
          {groups.map((g, i) => (
            <details key={g} open={i < 2} className="glass group rounded-2xl">
              <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 font-semibold">
                {g}
                <span className="text-xl transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="flex flex-col gap-3 px-6 pb-6">
                {contentFields
                  .filter((f) => f.group === g)
                  .map((f) => (
                    <label key={f.key} className="field">
                      {f.label}
                      {f.long ? (
                        <textarea className="input min-h-24" name={f.key} defaultValue={content[f.key]} maxLength={f.max} />
                      ) : (
                        <input className="input" name={f.key} defaultValue={content[f.key]} maxLength={f.max} />
                      )}
                    </label>
                  ))}
              </div>
            </details>
          ))}
          <div className="sticky bottom-4 z-10 flex items-center gap-4 rounded-full border border-bone bg-ink-2 p-2 pr-5 shadow-[4px_4px_0_var(--color-bone)]">
            <button className="btn btn-primary btn-sm" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <p role="status" className={`text-sm ${state?.error ? "text-coral" : ""}`}>
              {dirty ? "Modifications non enregistrées" : (state?.error ?? state?.message ?? "Tout est à jour")}
            </p>
          </div>
        </form>
      </div>

      <div className="glass flex flex-col overflow-hidden rounded-2xl xl:sticky xl:top-6 xl:h-[calc(100dvh-3rem)]">
        <div className="flex items-center justify-between gap-3 border-b border-bone px-4 py-2.5 text-xs">
          <div role="radiogroup" aria-label="Taille de l'aperçu" className="flex gap-1">
            {(
              [
                ["desktop", "Ordinateur"],
                ["mobile", "Mobile"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={device === value}
                onClick={() => setDevice(value)}
                className={`rounded-full px-3 py-1.5 ${device === value ? "bg-bone text-ink" : "hover:bg-ink-3"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <a href={`/s/${slug}`} target="_blank" rel="noopener" className="underline underline-offset-4">
            Ouvrir en grand ↗
          </a>
        </div>
        <div className="flex min-h-[70vh] flex-1 justify-center bg-ink-3 xl:min-h-0">
          <iframe
            key={version}
            src={`/s/${slug}`}
            title="Aperçu du site"
            className={`h-full min-h-[70vh] bg-white transition-[width] duration-500 xl:min-h-0 ${
              device === "mobile" ? "w-[390px] border-x border-bone" : "w-full"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
