"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPhoto } from "@/app/actions/client";
import { photoSlots, type PhotoKey, type SiteContent } from "@/lib/templates";

/** Gestion des photos d'un site : un cadre par emplacement, envoi et retrait immédiats. */
export default function PhotoManager({
  siteId,
  content,
  onChange,
}: {
  siteId: string;
  content: SiteContent;
  onChange: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<PhotoKey | null>(null);
  const [error, setError] = useState("");

  const send = (slot: PhotoKey, file?: File) => {
    const fd = new FormData();
    fd.set("siteId", siteId);
    fd.set("slot", slot);
    if (file) fd.set("file", file);
    setBusy(slot);
    setError("");
    startTransition(async () => {
      const result = await setPhoto(fd);
      setBusy(null);
      if (result?.error) return setError(result.error);
      onChange();
      router.refresh();
    });
  };

  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="kicker mb-4">Photos</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photoSlots.map((s) => {
          const src = content[s.key];
          return (
            <li key={s.key} className="flex flex-col gap-2">
              <div className="photo aspect-square rounded-lg border border-line text-bone">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={s.label} />
                ) : (
                  <div className="photo-empty" aria-hidden="true">
                    <span>Vide</span>
                  </div>
                )}
                {busy === s.key && pending && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/70 text-xs">Envoi…</div>
                )}
              </div>
              <p className="text-xs text-mute">{s.label}</p>
              <div className="flex gap-2 text-xs">
                <label className="cursor-pointer underline underline-offset-4 focus-within:text-accent">
                  {src ? "Remplacer" : "Ajouter"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={pending}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) return setError("Photo trop lourde (5 Mo maximum).");
                      send(s.key, file);
                    }}
                  />
                </label>
                {src && (
                  <button type="button" className="text-coral underline underline-offset-4" disabled={pending} onClick={() => send(s.key)}>
                    Retirer
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-mute">JPEG, PNG ou WebP, 5 Mo maximum. La photo est en ligne dès l&apos;envoi.</p>
      <p role="alert" className="mt-2 min-h-4 text-sm text-coral">
        {error}
      </p>
    </section>
  );
}
