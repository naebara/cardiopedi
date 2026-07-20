import "server-only";

import { headers } from "next/headers";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

export const AUDIT_VIEWER_EMAIL = "natanaelbarag@gmail.com";

export type AuditCategory = "APPOINTMENTS" | "AUTH" | "PATIENTS" | "SCHEDULE" | "SECURITY" | "SERVICES" | "USERS";
export type AuditStatus = "DENIED" | "FAILURE" | "SUCCESS";
export type AuditChanges = Record<string, { after: unknown; before: unknown }>;

export type AuditActor = {
  email: string;
  id?: string | null;
};

export type AuditEvent = {
  action: string;
  actor: AuditActor;
  category: AuditCategory;
  changes?: AuditChanges;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown>;
  status?: AuditStatus;
  summary: string;
};

export function changedFields<T extends Record<string, unknown>>(before: T, afterValue: T): AuditChanges {
  return Object.fromEntries(
    Object.keys(afterValue)
      .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(afterValue[key]))
      .map((key) => [key, { after: afterValue[key] ?? null, before: before[key] ?? null }]),
  );
}

async function persistAuditEvent(event: AuditEvent) {
  const changes = event.changes ? JSON.stringify(event.changes) : null;
  const metadata = event.metadata ? JSON.stringify(event.metadata) : null;

  await prisma.$executeRaw`
    INSERT INTO "AuditLog" (
      "id", "actorUserId", "actorEmail", "category", "action", "status",
      "entityType", "entityId", "summary", "changes", "metadata", "createdAt"
    ) VALUES (
      ${crypto.randomUUID()}, ${event.actor.id ?? null}, ${event.actor.email.toLowerCase()},
      ${event.category}, ${event.action}, ${event.status ?? "SUCCESS"},
      ${event.entityType ?? null}, ${event.entityId ?? null}, ${event.summary},
      ${changes}::jsonb, ${metadata}::jsonb, NOW()
    )
  `;
}

async function requestMetadata() {
  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ipAddress = requestHeaders.get("cf-connecting-ip")
      ?? requestHeaders.get("x-real-ip")
      ?? forwardedFor;

    return ipAddress ? { ipAddress: ipAddress.slice(0, 64) } : {};
  } catch {
    return {};
  }
}

export function enqueueAuditEvent(event: AuditEvent) {
  // Capture request data while the Server Component/Action is still rendering;
  // the promise is consumed only after the response has been sent.
  const connectionPromise = requestMetadata();

  try {
    after(async () => {
      try {
        const connection = await connectionPromise;
        await persistAuditEvent({
          ...event,
          metadata: { ...event.metadata, ...connection },
        });
      } catch (error) {
        console.error("Audit persistence failed", {
          action: event.action,
          entityId: event.entityId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  } catch (error) {
    console.error("Audit scheduling failed", {
      action: event.action,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
