import ActionForm from "@/components/ActionForm";
import { sendMessageAction } from "@/app/actions/mailbox";

export default async function NouveauMessage({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const to = ((await searchParams).a ?? "").slice(0, 160);
  return (
    <>
      <h2 className="mb-4 text-lg font-semibold">Nouveau message</h2>
      <ActionForm action={sendMessageAction} submit="Envoyer" reset className="flex max-w-2xl flex-col gap-3">
        <label className="field">
          À
          <input className="input" type="email" name="to" defaultValue={to} required maxLength={160} />
        </label>
        <label className="field">
          Objet
          <input className="input" name="subject" required maxLength={200} />
        </label>
        <label className="field">
          Message
          <textarea className="input min-h-48" name="text" required maxLength={50000} />
        </label>
      </ActionForm>
    </>
  );
}
