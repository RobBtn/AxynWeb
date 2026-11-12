"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setProspectTagAction } from "@/app/actions/admin";
import { parseTags, prospectTags, type ProspectTagId } from "@/lib/prospect-tags";

/** Cases de suivi d'un prospect : chaque clic est enregistré tout de suite. */
export default function ProspectTags({ id, name, tags }: { id: string; name: string; tags: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic<ProspectTagId[], { tag: ProspectTagId; on: boolean }>(
    parseTags(tags),
    (current, { tag, on }) => (on ? [...new Set([...current, tag])] : current.filter((t) => t !== tag))
  );

  function toggle(tag: ProspectTagId, on: boolean) {
    setError(null);
    startTransition(async () => {
      setChecked({ tag, on });
      const res = await setProspectTagAction(id, tag, on);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-busy={pending}>
      <legend className="sr-only">Suivi de {name}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {prospectTags.map((t) => (
          <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
              checked={checked.includes(t.id)}
              onChange={(e) => toggle(t.id, e.target.checked)}
            />
            {t.label}
          </label>
        ))}
      </div>
      {error && (
        <p role="status" className="mt-2 text-sm text-coral">
          {error}
        </p>
      )}
    </fieldset>
  );
}
