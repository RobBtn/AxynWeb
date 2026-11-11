import "server-only";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DataError } from "./data";
import { get, run, type SiteRow } from "./db";
import { MEDIA_PATH, photoSlots, type PhotoKey } from "./templates";

/**
 * Photos des sites clients, stockées dans data/uploads/<site>/<uuid>.<ext>.
 * Le type est déterminé par la signature binaire du fichier, jamais par son
 * nom ni par le type annoncé par le navigateur.
 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ROOT = path.join(process.cwd(), "data", "uploads");
const UUID = /^[0-9a-f-]{36}$/;
const FILE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

function sniff(bytes: Buffer): "jpg" | "png" | "webp" | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

/** Chemin disque d'une photo, ou null si le chemin demandé n'est pas strictement valide. */
export function mediaFile(siteId: string, file: string): string | null {
  if (!UUID.test(siteId) || !FILE.test(file)) return null;
  return path.join(ROOT, siteId, file);
}

function removeByUrl(url: unknown) {
  if (typeof url !== "string" || !MEDIA_PATH.test(url)) return;
  const [, , , siteId, file] = url.split("/");
  const target = mediaFile(siteId, file);
  if (target) rmSync(target, { force: true });
}

function readContent(site: SiteRow): Record<string, unknown> {
  try {
    return JSON.parse(site.content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isSlot(slot: string): slot is PhotoKey {
  return photoSlots.some((s) => s.key === slot);
}

/** Enregistre (ou remplace) la photo d'un emplacement. */
export async function savePhoto(site: SiteRow, slot: string, file: File) {
  if (site.kind !== "template") throw new DataError("Les photos se gèrent sur les sites basés sur un modèle.");
  if (!isSlot(slot)) throw new DataError("Emplacement inconnu.");
  if (file.size === 0) throw new DataError("Choisissez une photo.");
  if (file.size > MAX_PHOTO_BYTES) throw new DataError("Photo trop lourde (5 Mo maximum).");
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) throw new DataError("Format non accepté. Utilisez une photo JPEG, PNG ou WebP.");

  const name = `${randomUUID()}.${ext}`;
  mkdirSync(path.join(ROOT, site.id), { recursive: true });
  writeFileSync(path.join(ROOT, site.id, name), bytes);

  const content = readContent(site);
  removeByUrl(content[slot]);
  content[slot] = `/api/media/${site.id}/${name}`;
  run("UPDATE sites SET content = ?, updated_at = datetime('now') WHERE id = ?", JSON.stringify(content), site.id);
}

export function removePhoto(site: SiteRow, slot: string) {
  if (!isSlot(slot)) throw new DataError("Emplacement inconnu.");
  const content = readContent(site);
  removeByUrl(content[slot]);
  content[slot] = "";
  run("UPDATE sites SET content = ?, updated_at = datetime('now') WHERE id = ?", JSON.stringify(content), site.id);
}

/** Supprime toutes les photos d'un site (à la suppression du site). */
export function removeSiteMedia(siteId: string) {
  if (UUID.test(siteId)) rmSync(path.join(ROOT, siteId), { recursive: true, force: true });
}

export function readMedia(siteId: string, file: string): { bytes: Buffer; type: string } | null {
  const target = mediaFile(siteId, file);
  if (!target || !get("SELECT 1 AS x FROM sites WHERE id = ?", siteId)) return null;
  try {
    return { bytes: readFileSync(target), type: MIME[file.split(".").pop()!] };
  } catch {
    return null;
  }
}
