import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

// spec §8/§9: icon images are stored in a cloud object store (Vercel Blob)
// and referenced by URL from Ingredient.iconImageUrl. Requires
// BLOB_READ_WRITE_TOKEN in the environment (see .env.example) — Vercel
// injects it automatically for deployments with a Blob store attached; for
// local dev, pull it from the dashboard or `vercel env pull`.
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
  const pathname = `icons/${randomUUID()}.${extension}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return blob.url;
}
