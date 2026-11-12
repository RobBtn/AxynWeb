import { redirect } from "next/navigation";

/** Ancien lien d'une conversation : elle s'ouvre maintenant dans la vue à deux colonnes. */
export default async function ThreadRedirect({ params }: { params: Promise<{ thread: string }> }) {
  redirect(`/admin/messagerie/conversations?c=${encodeURIComponent((await params).thread)}`);
}
