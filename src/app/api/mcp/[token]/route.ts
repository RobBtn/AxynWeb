import { handleMcpPost, methodNotAllowed } from "@/lib/mcp-http";

/**
 * Serveur MCP, jeton dans l'adresse : /api/mcp/<jeton>. C'est le « lien » à coller dans Claude : il contient le
 * secret, il ne se partage donc avec personne et se révoque depuis /admin/mcp.
 */
export const POST = async (req: Request, ctx: { params: Promise<{ token: string }> }) => handleMcpPost(req, (await ctx.params).token);
export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
