import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import MailFrame from "@/components/MailFrame";
import { frMailDate } from "@/lib/format";
import { mailActionAction, sendMessageAction } from "@/app/actions/mailbox";
import { emailOf, getMailMessage, listFolders, prospectsByEmail, setMessagesSeen } from "@/lib/inbox";

/** Volet de lecture : en-têtes, actions, contenu du message, fil de la conversation et réponse. */
export default function MessageView({ id, backHref, hrefFor }: { id: string; backHref: string; hrefFor: (messageId: string) => string }) {
  const data = getMailMessage(id);
  if (!data) return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-mute">Message introuvable.</p>;
  const { message: m, thread, siblings, refs } = data;
  if (m.box === "inbox" && !m.seen) setMessagesSeen([m.id], true);
  const folders = listFolders();

  const counterpart = emailOf((m.box === "sent" ? m.to_addr : m.from_addr).split(",")[0]);
  const prospect = prospectsByEmail([counterpart]).get(counterpart);
  const subject = m.subject || "(sans objet)";
  const quoted = m.body
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");
  const reSubject = /^re\s*:/i.test(m.subject) ? m.subject : `Re: ${m.subject}`;

  return (
    <article>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-xl font-semibold">{subject}</h2>
        <div className="xl:hidden">
          <Link href={backHref} className="btn btn-ghost btn-sm">
            ← Liste
          </Link>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-y border-line py-2.5">
        <a href="#repondre" className="btn btn-primary btn-sm">
          Répondre
        </a>
        {m.box === "inbox" && (
          <ActionForm action={mailActionAction} submit="Marquer non lu" variant="ghost">
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="op" value="unread" />
          </ActionForm>
        )}
        <ActionForm action={mailActionAction} submit="Classer" variant="ghost" className="flex items-center gap-1.5">
          <input type="hidden" name="id" value={m.id} />
          <input type="hidden" name="op" value="move" />
          <select className="input !w-auto !py-1.5 text-sm" name="folder" defaultValue={thread?.folder_id ?? ""} aria-label="Dossier">
            <option value="">Sans dossier</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </ActionForm>
        <ActionForm action={mailActionAction} submit="Supprimer" variant="danger" confirm="Supprimer ce message ? Il est déplacé dans la corbeille de la messagerie.">
          <input type="hidden" name="id" value={m.id} />
          <input type="hidden" name="op" value="delete" />
          <input type="hidden" name="from" value="reading" />
          <input type="hidden" name="back" value={backHref} />
        </ActionForm>
      </div>

      {/* En-têtes */}
      <dl className="mb-4 grid grid-cols-[4rem_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-mute">De</dt>
        <dd className="break-words">{m.from_addr}</dd>
        <dt className="text-mute">À</dt>
        <dd className="break-words">{m.to_addr}</dd>
        <dt className="text-mute">Date</dt>
        <dd className="font-mono text-xs leading-6">{frMailDate(m.date)}</dd>
        {m.sent_by && (
          <>
            <dt className="text-mute">Envoyé par</dt>
            <dd>{m.sent_by}</dd>
          </>
        )}
        {prospect && (
          <>
            <dt className="text-mute">Prospect</dt>
            <dd>
              {prospect.name} ·{" "}
              <Link href={`/admin/prospects?q=${encodeURIComponent(prospect.name)}#prospection`} className="underline">
                voir la fiche
              </Link>
            </dd>
          </>
        )}
      </dl>

      {/* Contenu */}
      <div className="overflow-hidden rounded-xl border border-line bg-ink-3 p-3 text-sm">
        {m.html ? <MailFrame id={m.id} /> : <div className="whitespace-pre-wrap break-words">{m.body || "(message vide)"}</div>}
      </div>

      {/* Fil de la conversation */}
      {siblings.length > 1 && (
        <section className="mt-5" aria-label="Conversation">
          <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-mute">Conversation · {siblings.length} messages</h3>
          <ul className="grid gap-1">
            {siblings.map((s) => (
              <li key={s.id}>
                <Link
                  href={hrefFor(s.id)}
                  className={`flex items-baseline justify-between gap-3 rounded-lg px-3 py-1.5 text-sm ${s.id === m.id ? "bg-ink-3 font-medium" : "hover:bg-ink-2"}`}
                >
                  <span className="min-w-0 truncate">
                    {s.box === "sent" ? `Envoyé${s.sent_by ? ` par ${s.sent_by}` : ""} → ${s.to_addr}` : `Reçu de ${s.from_addr}`}
                  </span>
                  <span className="shrink-0 font-mono text-[0.68rem] text-mute">{frMailDate(s.date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Réponse */}
      <section id="repondre" className="mt-6 scroll-mt-6">
        <h3 className="mb-3 text-lg font-semibold">Répondre</h3>
        <ActionForm action={sendMessageAction} submit="Envoyer" reset className="flex flex-col gap-3">
          <input type="hidden" name="inReplyTo" value={m.message_id} />
          <input type="hidden" name="references" value={refs.join(" ")} />
          <label className="field">
            À
            <input className="input" type="email" name="to" defaultValue={counterpart} required maxLength={160} />
          </label>
          <label className="field">
            Objet
            <input className="input" name="subject" defaultValue={reSubject} required maxLength={200} />
          </label>
          <label className="field">
            Message
            <textarea
              className="input min-h-40"
              name="text"
              required
              maxLength={50000}
              defaultValue={`\n\nLe ${frMailDate(m.date)}, ${m.box === "sent" ? "nous avons" : `${m.from_addr} a`} écrit :\n${quoted}`}
            />
          </label>
        </ActionForm>
      </section>
    </article>
  );
}
