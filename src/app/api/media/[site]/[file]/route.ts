import { readMedia } from "@/lib/media";

/** Sert une photo envoyée par un client. Noms aléatoires, donc cache long et immuable. */
export async function GET(_req: Request, { params }: { params: Promise<{ site: string; file: string }> }) {
  const { site, file } = await params;
  const media = readMedia(site, file);
  if (!media) return new Response("Introuvable", { status: 404 });
  return new Response(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
