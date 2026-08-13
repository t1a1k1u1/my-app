import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// spec §8/§9: production is meant to store icon images in a cloud object
// store (Vercel Blob or S3-compatible), referenced by URL from
// Ingredient.iconImageUrl. This local-filesystem implementation is the dev
// fallback — it satisfies the same `saveIcon(file) -> url` contract, so
// swapping in a real cloud-storage SDK later only means changing this file.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "icons");
const PUBLIC_PATH_PREFIX = "/uploads/icons";

const MAX_ICON_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export class InvalidIconError extends Error {}

export async function saveIcon(file: File): Promise<string> {
  if (!(file.type in ALLOWED_TYPES)) {
    throw new InvalidIconError(`unsupported image type: ${file.type}`);
  }
  if (file.size > MAX_ICON_BYTES) {
    throw new InvalidIconError("image too large (max 5MB)");
  }

  const extension = ALLOWED_TYPES[file.type];
  const filename = `${randomUUID()}.${extension}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `${PUBLIC_PATH_PREFIX}/${filename}`;
}
