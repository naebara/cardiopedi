import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AUDIT_PAGE_SIZE = 50;

export type AuditFilters = {
  action: string;
  category: string;
  from: string;
  page: number;
  q: string;
  status: string;
  to: string;
};

export type AuditRow = {
  action: string;
  actorEmail: string;
  category: string;
  changes: Record<string, { after: unknown; before: unknown }> | null;
  createdAt: string;
  entityId: string | null;
  entityType: string | null;
  id: string;
  metadata: Record<string, unknown> | null;
  status: string;
  summary: string;
};

type DatabaseAuditRow = Omit<AuditRow, "createdAt"> & { createdAt: Date };
type AuditStatsRow = { actors: number; today: number; total: number };

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseAuditFilters(searchParams: Record<string, string | string[] | undefined>): AuditFilters {
  const value = (key: string) => String(searchParams[key] ?? "").trim();
  const requestedPage = Number(value("page"));

  return {
    action: value("action"),
    category: value("category"),
    from: validDate(value("from")) ? value("from") : "",
    page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    q: value("q").slice(0, 120),
    status: value("status"),
    to: validDate(value("to")) ? value("to") : "",
  };
}

function filterSql(filters: AuditFilters) {
  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (filters.category) conditions.push(Prisma.sql`"category" = ${filters.category}`);
  if (filters.action) conditions.push(Prisma.sql`"action" = ${filters.action}`);
  if (filters.status) conditions.push(Prisma.sql`"status" = ${filters.status}`);
  if (filters.from) conditions.push(Prisma.sql`"createdAt" >= (${filters.from}::date::timestamp AT TIME ZONE 'Europe/Bucharest')`);
  if (filters.to) conditions.push(Prisma.sql`"createdAt" < ((${filters.to}::date + 1)::timestamp AT TIME ZONE 'Europe/Bucharest')`);
  if (filters.q) {
    const query = `%${filters.q}%`;
    conditions.push(Prisma.sql`(
      "actorEmail" ILIKE ${query} OR "summary" ILIKE ${query} OR
      "action" ILIKE ${query} OR COALESCE("entityId", '') ILIKE ${query} OR
      COALESCE("metadata"->>'ipAddress', '') ILIKE ${query}
    )`);
  }
  return Prisma.join(conditions, " AND ");
}

export async function getAuditPage(filters: AuditFilters) {
  const where = filterSql(filters);
  const offset = (filters.page - 1) * AUDIT_PAGE_SIZE;
  const [databaseRows, statsRows] = await Promise.all([
    prisma.$queryRaw<DatabaseAuditRow[]>(Prisma.sql`
      SELECT "id", "actorEmail", "category", "action", "status", "entityType",
             "entityId", "summary", "changes", "metadata", "createdAt"
      FROM "AuditLog" WHERE ${where}
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT ${AUDIT_PAGE_SIZE} OFFSET ${offset}
    `),
    prisma.$queryRaw<AuditStatsRow[]>(Prisma.sql`
      SELECT COUNT(*)::int AS "total",
             COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('day', NOW() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest')::int AS "today",
             COUNT(DISTINCT "actorEmail")::int AS "actors"
      FROM "AuditLog" WHERE ${where}
    `),
  ]);
  const stats = statsRows[0] ?? { actors: 0, today: 0, total: 0 };

  return {
    pageCount: Math.max(1, Math.ceil(stats.total / AUDIT_PAGE_SIZE)),
    rows: databaseRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    stats,
  };
}
