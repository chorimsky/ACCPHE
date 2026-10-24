import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { applications, files, reviews } from "@/db/schema";
import { awaitingDecision, canAccess } from "@/lib/domain";
import { audit } from "@/server/audit";
import { currentUser, mfaSetupPending, officeOf } from "@/server/auth";
import { getFileStream, INLINE_MIME } from "@/server/storage";

/**
 * Download an uploaded document. Allowed for: application staff; the institution the file belongs to; reviewers
 * appointed to that application (after their conflict-of-interest declaration); Commission members while the
 * application is before them.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (user && mfaSetupPending(user)) return new Response("Set up two-step verification first.", { status: 403 });
  if (!user) return new Response("Sign in to the portal to download this document.", { status: 401 });
  const { id } = await params;
  const [f] = await db.select().from(files).where(eq(files.id, id));
  if (!f) return new Response("Not found", { status: 404 });
  const [app] = await db.select().from(applications).where(eq(applications.id, f.applicationId));
  if (!app) return new Response("Not found", { status: 404 });

  let allowed = canAccess(user.role, "applications");
  if (!allowed && user.role === "institution") allowed = user.applicationId === app.id;
  if (!allowed && user.role === "reviewer") {
    const [r] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.applicationId, app.id), eq(reviews.reviewerId, user.id), isNotNull(reviews.coiConfirmedAt), isNull(reviews.conflictDeclaredAt)));
    allowed = !!r;
  }
  if (!allowed && user.role === "commission") allowed = awaitingDecision(app);
  if (!allowed) return new Response("Not found", { status: 404 });

  let stream: ReadableStream<Uint8Array>;
  let size: number | null;
  try {
    ({ stream, size } = await getFileStream(f.storageKey));
  } catch {
    return new Response("The file is no longer available.", { status: 410 });
  }
  if (user.role !== "institution") {
    await audit({ actorId: user.id, who: officeOf(user), action: "document.download", entityType: "application", entityId: app.id, summary: `${user.name} downloaded ${f.fileName} (${app.ref})` });
  }
  const inline = INLINE_MIME.has(f.mimeType);
  const name = encodeURIComponent(f.fileName);
  return new Response(stream, {
    headers: {
      "Content-Type": f.mimeType,
      ...(size !== null ? { "Content-Length": String(size) } : {}),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${name}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; object-src 'self'",
    },
  });
}
