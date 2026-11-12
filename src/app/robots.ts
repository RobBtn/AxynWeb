import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/** Espaces privés, API et aperçus de sites clients : rien à indexer. */
const PRIVATE = ["/admin", "/client", "/api/", "/connexion", "/inscription", "/s/", "/d/"];

/**
 * Les robots des moteurs de réponse (ChatGPT, Claude, Perplexity, Gemini…) sont explicitement admis :
 * être cité par eux fait partie du référencement. Seuls les espaces privés leur sont fermés.
 */
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
