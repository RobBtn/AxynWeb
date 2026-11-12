import { redirect } from "next/navigation";
import { latestMessageOfThread } from "@/lib/inbox";

/** Ancien lien d'une conversation : on ouvre son message le plus récent dans la messagerie. */
export default async function ThreadRedirect({ params }: { params: Promise<{ thread: string }> }) {
  const id = latestMessageOfThread((await params).thread);
  redirect(id ? `/admin/messagerie?m=${id}` : "/admin/messagerie");
}
