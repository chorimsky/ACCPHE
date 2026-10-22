import "server-only";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { get as blobGet, put as blobPut } from "@vercel/blob";
import { randomToken } from "@/lib/crypto";
import { UserError } from "@/lib/action";

/**
 * File storage adapter.
 * - "vercel-blob" (STORAGE_DRIVER=vercel-blob): private Vercel Blob store, required in production. Credentials come
 *   from the connected store — BLOB_STORE_ID with the deployment's OIDC token (current stores) or BLOB_READ_WRITE_TOKEN.
 * - "local" (default): writes under STORAGE_DIR (default ./storage). Development / tests only — a serverless
 *   filesystem is read-only and ephemeral, so the local driver refuses to run on Vercel or in production.
 * Files are always served through /api/files/[id], which checks permissions first.
 */

/**
 * Uploads go through Server Actions, and Vercel Functions reject request bodies over 4.5 MB, so files are
 * capped at 4 MB (leaving room for the multipart envelope and other form fields). Keep in sync with
 * `serverActions.bodySizeLimit` in next.config.ts.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "4 MB";

function blobDriver() {
  return process.env.STORAGE_DRIVER === "vercel-blob";
}

/** Root of the local driver, computed lazily so production builds don't trace the project directory. */
function localRoot(): string {
  // Only checked when the local driver is actually used (`next build` also runs with NODE_ENV=production).
  // ALLOW_LOCAL_STORAGE=1 lets the e2e suite use local files with `next start`; it is never honoured on Vercel.
  if (process.env.VERCEL || (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_STORAGE !== "1")) {
    throw new Error(
      "Local file storage is not available in production. Set STORAGE_DRIVER=vercel-blob and connect a private Vercel Blob store.",
    );
  }
  return path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "storage"));
}

/**
 * Allowed types, keyed by extension. The stored MIME type comes from this table (never from the
 * browser-supplied `file.type`), and the file's first bytes must match the expected signature, so a
 * renamed HTML/script file can't be uploaded as a "PDF".
 */
type Kind = "pdf" | "ole" | "zip" | "png" | "jpeg" | "webp" | "text";
const TYPES: Record<string, { mime: string; kind: Kind }> = {
  pdf: { mime: "application/pdf", kind: "pdf" },
  doc: { mime: "application/msword", kind: "ole" },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "zip" },
  xls: { mime: "application/vnd.ms-excel", kind: "ole" },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "zip" },
  ppt: { mime: "application/vnd.ms-powerpoint", kind: "ole" },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "zip" },
  png: { mime: "image/png", kind: "png" },
  jpg: { mime: "image/jpeg", kind: "jpeg" },
  jpeg: { mime: "image/jpeg", kind: "jpeg" },
  webp: { mime: "image/webp", kind: "webp" },
  txt: { mime: "text/plain", kind: "text" },
  csv: { mime: "text/csv", kind: "text" },
};
export const ALLOWED_MIME = [...new Set(Object.values(TYPES).map((t) => t.mime))];
export const ALLOWED_EXTENSIONS = Object.keys(TYPES).map((e) => `.${e}`);
/** For `<input type="file" accept={UPLOAD_ACCEPT}>`. */
export const UPLOAD_ACCEPT = ALLOWED_EXTENSIONS.join(",");

/** MIME types that browsers may render inline safely (everything else is served as a download). */
export const INLINE_MIME = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"]);

function startsWith(bytes: Uint8Array, sig: number[], offset = 0) {
  return sig.every((b, i) => bytes[offset + i] === b);
}

function matchesSignature(bytes: Uint8Array, kind: Kind): boolean {
  switch (kind) {
    case "pdf":
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
    case "ole":
      return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "zip":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case "png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "webp":
      return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case "text": {
      // Plain text / CSV: no NUL bytes and no markup a browser might sniff as HTML.
      const head = Buffer.from(bytes.subarray(0, 4096));
      if (head.includes(0)) return false;
      return !/<\s*(script|html|iframe|svg|object|embed)\b/i.test(head.toString("utf8"));
    }
  }
}

/** Clean a user-supplied file name: no path parts, no control or shell-special characters. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .normalize("NFKC")
    .replace(/[^\w.\- ()]+/g, "_")
    .replace(/^[.\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "file";
  if (cleaned.length <= 120) return cleaned;
  const ext = path.extname(cleaned).slice(0, 10);
  return cleaned.slice(0, 120 - ext.length) + ext;
}

/** Resolve a storage key to a path inside the local root, refusing anything that escapes it. */
function resolveKey(key: string): string {
  const root = localRoot();
  const full = path.resolve(/*turbopackIgnore: true*/ root, key);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}

/** Only ever read from Vercel Blob storage (the key is ours, but never let it become an SSRF vector). */
function blobUrl(key: string): string {
  const url = key.slice(5);
  if (!/^https:\/\/[a-z0-9-]+\.(private\.)?blob\.vercel-storage\.com\//i.test(url)) throw new Error("Invalid storage key");
  return url;
}

export async function putFile(file: File): Promise<{ key: string; size: number; mimeType: string; fileName: string }> {
  if (!file || file.size === 0) throw new UserError("The file is empty");
  if (file.size > MAX_UPLOAD_BYTES) throw new UserError(`File is larger than ${MAX_UPLOAD_LABEL}`);
  const safeName = safeFileName(file.name || "file");
  const ext = path.extname(safeName).slice(1).toLowerCase();
  const type = TYPES[ext];
  if (!type) throw new UserError(`This file type is not allowed. Use one of: ${ALLOWED_EXTENSIONS.join(", ")}`);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new UserError(`File is larger than ${MAX_UPLOAD_LABEL}`);
  if (!matchesSignature(bytes, type.kind)) throw new UserError(`The file doesn’t look like a valid .${ext} file`);
  const mimeType = type.mime;
  const key = `${new Date().toISOString().slice(0, 7)}/${randomToken(12)}-${safeName}`;

  if (blobDriver()) {
    const blob = await blobPut(key, bytes, { access: "private", contentType: mimeType });
    return { key: `blob:${blob.url}`, size: bytes.byteLength, mimeType, fileName: safeName };
  }
  const full = resolveKey(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes, { flag: "wx" });
  return { key, size: bytes.byteLength, mimeType, fileName: safeName };
}

/** Store generated bytes (e.g. seed files, receipts). */
export async function putBytes(name: string, bytes: Buffer | string, mimeType: string) {
  const blob = new File([new Uint8Array(typeof bytes === "string" ? Buffer.from(bytes) : bytes)], name, { type: mimeType });
  return putFile(blob);
}

export async function getFile(key: string): Promise<Buffer> {
  if (key.startsWith("blob:")) {
    const res = await blobGet(blobUrl(key), { access: "private" });
    if (!res || res.statusCode !== 200) throw new Error("File not found");
    return Buffer.from(await new Response(res.stream).arrayBuffer());
  }
  return readFile(resolveKey(key));
}

/** Open a stored file as a web stream (no buffering). `size` is the byte length when known. */
export async function getFileStream(key: string): Promise<{ stream: ReadableStream<Uint8Array>; size: number | null }> {
  if (key.startsWith("blob:")) {
    const res = await blobGet(blobUrl(key), { access: "private" });
    if (!res || res.statusCode !== 200) throw new Error("File not found");
    return { stream: res.stream, size: typeof res.blob.size === "number" ? res.blob.size : null };
  }
  const full = resolveKey(key);
  const info = await stat(full);
  if (!info.isFile()) throw new Error("File not found");
  return { stream: Readable.toWeb(createReadStream(full)) as ReadableStream<Uint8Array>, size: info.size };
}
