import { headers } from "next/headers";

/**
 * Données structurées schema.org, regroupées dans un seul @graph. Le nonce de la CSP (posé par proxy.ts)
 * est repris par prudence, et « < » est échappé pour qu'aucun texte ne puisse refermer la balise.
 */
export default async function JsonLd({ items }: { items: object[] }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": items }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: json }} />;
}
