import { handleMcpPost, methodNotAllowed } from "@/lib/mcp-http";

/** Serveur MCP, jeton dans l'en-tête Authorization (voir src/lib/mcp-http.ts). */
export const POST = (req: Request) => handleMcpPost(req);
export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
