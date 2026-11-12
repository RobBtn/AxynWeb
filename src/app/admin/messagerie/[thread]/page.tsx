import Link from "next/link";
import { notFound } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import { Card, frDate } from "@/components/Shell";
import { deleteThreadAction, moveThreadAction, sendMessageAction } from "@/app/actions/mailbox";
import { emailOf, getThread, listFolders, markThreadSeen } from "@/lib/inbox";

export const dynamic = "force-dynamic";

export default async function Conversation({ params }: { params: Promise<{ thread: string }> }) {
  const { thread: id } = await params;
  const data = getThread(id);
  if (!data) notFound();
  const { thread, messages } = data;
  markThreadSeen(id);
  const folders = listFolders();

  const last = messages[messages.length - 1];
  const lastIn = [...messages].reverse().find((m) => m.box === "inbox");
  const to = lastIn ? emailOf(lastIn.from_addr) : last ? emailOf(last.to_addr.split(",")[0]) : "";
  const ids = messages.map((m) => m.message_id).filter(Boolean);
  const subject = thread.subject || "(sans objet)";
  const quoted = last
    ? last.body
        .split("\n")
        .map((l) => `> ${l}`)
        .join("\n")
    : "";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 break-words text-xl font-semibold">{subject}</h2>
        <Link href="/admin/messagerie" className="btn btn-ghost btn-sm">
          ← Retour
        </Link>
      </div>

      <div className="grid gap-3">
        {messages.map((m) => (
          <Card key={m.id} tone={m.box === "sent" ? "info" : undefined}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <p className="min-w-0 break-words">
                <span className="font-semibold">{m.box === "sent" ? `Envoyé${m.sent_by ? ` par ${m.sent_by}` : ""}` : "Reçu"}</span>
                <span className="text-mute"> · {m.box === "sent" ? `à ${m.to_addr}` : `de ${m.from_addr}`}</span>
              </p>
              <span className="font-mono text-xs text-mute">{frDate(m.date)}</span>
            </div>
            <div className="mt-3 whitespace-pre-wrap break-words border-t border-line pt-3 text-sm">{m.body || "(message vide)"}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-line pt-4">
        <ActionForm action={moveThreadAction} submit="Classer" variant="ghost" className="flex items-center gap-2">
          <input type="hidden" name="thread" value={id} />
          <select className="input !w-auto !py-2 text-sm" name="folder" defaultValue={thread.folder_id ?? ""} aria-label="Dossier">
            <option value="">Sans dossier</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </ActionForm>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-lg font-semibold">Répondre</h3>
        <ActionForm action={sendMessageAction} submit="Envoyer" reset className="flex flex-col gap-3">
          <input type="hidden" name="inReplyTo" value={last?.message_id ?? ""} />
          <input type="hidden" name="references" value={ids.join(" ")} />
          <label className="field">
            À
            <input className="input" type="email" name="to" defaultValue={to} required maxLength={160} />
          </label>
          <label className="field">
            Objet
            <input className="input" name="subject" defaultValue={`Re: ${thread.subject}`} required maxLength={200} />
          </label>
          <label className="field">
            Message
            <textarea
              className="input min-h-40"
              name="text"
              required
              maxLength={50000}
              defaultValue={last ? `\n\nLe ${frDate(last.date)}, ${last.box === "sent" ? "nous avons" : `${last.from_addr} a`} écrit :\n${quoted}` : ""}
            />
          </label>
        </ActionForm>
      </div>

      <div className="mt-6 border-t border-line pt-4">
        <ActionForm
          action={deleteThreadAction}
          submit="Supprimer la conversation"
          variant="danger"
          confirm="Supprimer cette conversation pour tous les administrateurs ? Les messages sont déplacés dans la corbeille de la messagerie."
        >
          <input type="hidden" name="thread" value={id} />
        </ActionForm>
      </div>
    </>
  );
}
