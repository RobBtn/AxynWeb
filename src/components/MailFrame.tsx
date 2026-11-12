"use client";

import { useRef, useState } from "react";

/** Affiche un e-mail HTML dans un cadre isolé, à la hauteur de son contenu, avec l'option « Afficher les images ». */
export default function MailFrame({ id }: { id: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [images, setImages] = useState(false);
  const [height, setHeight] = useState(240);

  const fit = () => {
    const doc = ref.current?.contentDocument;
    if (doc?.documentElement) setHeight(Math.min(Math.max(doc.documentElement.scrollHeight + 4, 120), 4000));
  };

  return (
    <div>
      <iframe
        ref={ref}
        title="Contenu du message"
        src={`/api/mail-html/${id}${images ? "?img=1" : ""}`}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        onLoad={() => {
          fit();
          setTimeout(fit, 400); // les images intégrées peuvent changer la hauteur après coup
        }}
        style={{ height }}
        className="w-full rounded-xl border-0 bg-white"
      />
      {!images && (
        <p className="mt-2 text-xs text-mute">
          Les images distantes sont masquées (elles peuvent servir à suivre l&apos;ouverture du message).{" "}
          <button type="button" className="underline" onClick={() => setImages(true)}>
            Afficher les images
          </button>
        </p>
      )}
    </div>
  );
}
