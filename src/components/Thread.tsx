import ActionForm from "./ActionForm";
import { Card, StatusPill, frDate } from "./Shell";
import { replyRequest } from "@/app/actions/client";
import { applyRequestWithAiAction } from "@/app/actions/admin";
import { all, type MessageRow, type RequestRow } from "@/lib/db";
import { REQUEST_STATUSES, statusLabel } from "@/lib/data";

/** Fil d'une demande de modification, partagé par les espaces client et admin. */
export default function Thread({ request, siteName, admin = false }: { request: RequestRow; siteName: string; admin?: boolean }) {
  const messages = all<MessageRow>("SELECT * FROM request_messages WHERE request_id = ? ORDER BY created_at ASC", request.id);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        <Card>
          <p className="text-xs text-mute">Demande initiale · {frDate(request.created_at)}</p>
          <p className="mt-3 whitespace-pre-wrap text-bone/90">{request.body}</p>
        </Card>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl p-5 ${
              m.author_role === "admin" ? "self-start bg-accent/40" : "self-end bg-ink-3"
            }`}
          >
            <p className="text-xs text-mute">
              {m.author_name} · {frDate(m.created_at)}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
        {admin && request.status !== "done" && (
          <Card title="Traiter avec l'IA">
            <p className="mb-3 text-sm text-mute">L&apos;IA applique la demande aux textes du site, répond au client et clôt la demande.</p>
            <ActionForm action={applyRequestWithAiAction} submit="Appliquer la demande avec l'IA">
              <input type="hidden" name="requestId" value={request.id} />
            </ActionForm>
          </Card>
        )}
        <Card title="Répondre">
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
