import { Button, Group, Text } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AuditFilters } from "../lib/audit-query";
import { auditText } from "../i18n";

function pageUrl(filters: AuditFilters, page: number) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, page }).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  return `/admin/audit?${params.toString()}`;
}

export function AuditPagination({ filters, pageCount }: { filters: AuditFilters; pageCount: number }) {
  if (pageCount <= 1) return null;
  const pageLabel = auditText.page.pageOf.replace("{page}", String(filters.page)).replace("{pages}", String(pageCount));

  return (
    <Group justify="space-between" mt="md">
      <Button
        component="a"
        href={pageUrl(filters, Math.max(1, filters.page - 1))}
        leftSection={<ChevronLeft size={16} />}
        style={{ visibility: filters.page > 1 ? "visible" : "hidden" }}
        variant="default"
      >
        {auditText.page.previous}
      </Button>
      <Text c="dimmed" fw={600} size="sm">{pageLabel}</Text>
      <Button
        component="a"
        href={pageUrl(filters, Math.min(pageCount, filters.page + 1))}
        rightSection={<ChevronRight size={16} />}
        style={{ visibility: filters.page < pageCount ? "visible" : "hidden" }}
        variant="default"
      >
        {auditText.page.next}
      </Button>
    </Group>
  );
}
