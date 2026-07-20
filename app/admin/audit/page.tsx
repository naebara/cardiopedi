import { requireAuditViewer } from "@/lib/admin-features";
import { AuditPageView } from "./AuditPageView";
import { getAuditPage, parseAuditFilters } from "./lib/audit-query";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAuditViewer();
  const filters = parseAuditFilters(await searchParams);
  const data = await getAuditPage(filters);

  return <AuditPageView {...data} filters={filters} viewerEmail={viewer.email} />;
}
