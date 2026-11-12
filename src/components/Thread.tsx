import ActionForm from "./ActionForm";
import { Card, StatusPill, frDate, toneClass } from "./Shell";
import { replyRequest } from "@/app/actions/client";
import { applyRequestWithAiAction } from "@/app/actions/admin";
import { all, get, type MessageRow, type RequestRow } from "@/lib/db";
import { REQUEST_STATUSES, statusLabel } from "@/lib/data";

/** Un message du fil : bleu pour le client, vert pour l'équipe, avec l'auteur en toutes lettres. */
function Message({
  from,
  author,
  date,
  mine,
  note,
  children,
}: {
  from: "client" | "admin";
  author: string;
  date: string;
  /** Message écrit par la personne qui regarde la page : aligné à droite. */
  mine: boolean;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`glass max-w-[88%] rounded-2xl p-5 ${toneClass(from === "client" ? "info" : "ok")} ${mine ? "self-end" : "self-start"}`}
      aria-label={`${from === "client" ? "Message du client" : "Réponse de l'équipe"} ${author}`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`pill ${from === "client" ? "pill-info" : "pill-ok"}`}>{from === "client" ? "Client" : "Équipe"}</span>
        <span className="text-sm font-semibold">{author}</span>
        <span className="text-xs text-mute">
          {note && `${note} · `}
          {date}
        </span>
      </header>
      <p className="mt-3 whitespace-pre-wrap">{children}</p>
    </article>
  );
}

/** Fil d'une demande de modification, partagé par les espaces client et admin. */
export default function Thread({ request, siteName, admin = false }: { request: RequestRow; siteName: string; admin?: boolean }) {
  const messages = all<MessageRow>("SELECT * FROM request_messages WHERE request_id = ? ORDER BY created_at ASC", request.id);
  const clientName = get<{ name: string }>("SELECT name FROM users WHERE id = ?", request.client_id)?.name;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <Message from="client" author={clientName ?? "Client"} date={frDate(request.created_at)} mine={!admin} note="Demande initiale">
          {request.body}
        </Message>
        {messages.map((m) => {
          const from = m.author_role === "admin" ? "admin" : "client";
          return (
            <Message key={m.id} from={from} author={m.author_name} date={frDate(m.created_at)} mine={admin ? from === "admin" : from === "client"}>
              {m.body}
            </Message>
          );
        })}
        {admin && request.status !== "done" && (
          <Card title="Traiter avec l'IA" tone="muted" className="mt-4">
            <p className="mb-3 text-sm text-mute">L&apos;IA applique la demande aux textes du site, répond au client et clôt la demande.</p>
            <ActionForm action={applyRequestWithAiAction} submit="Appliquer la demande avec l'IA">
              <input type="hidden" name="requestId" value={request.id} />
            </ActionForm>
          </Card>
        )}
        <Card title="Répondre" tone="muted" className={admin && request.status !== "done" ? "" : "mt-4"}>
          <ActionForm action={replyRequest} submit="Envoyer" reset className="flex flex-col gap-3">
            <input type="hidden" name="requestId" value={request.id} />
            <label className="field">
              Message
              <textarea className="input min-h-28" name="body" maxLength={4000} required={!admin} />
            </label>
            {admin && (
              <label className="field">
                Statut
                <select className="input" name="status" defaultValue={request.status}>
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </ActionForm>
        </Card>
      </div>
      <Card className="h-fit">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-mute">Site</dt>
            <dd className="mt-1 font-medium">{siteName}</dd>
          </div>
          <div>
            <dt className="text-mute">Statut</dt>
            <dd className="mt-1">
              <StatusPill status={request.status} label={statusLabel[request.status]} />
            </dd>
          </div>
          <div>
            <dt className="text-mute">Dernière activité</dt>
            <dd className="mt-1">{frDate(request.updated_at)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
