import "server-only";
import type { SessionUser } from "./auth";
import type { SiteRow } from "./db";

/** Un site non publié n'est visible que par l'admin et son propriétaire. */
export function canViewSite(site: SiteRow, user: SessionUser | null): boolean {
  if (site.status === "live") return true;
  if (!user) return false;
  return user.role === "admin" || site.client_id === user.id;
}
