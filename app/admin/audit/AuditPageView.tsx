import { Badge, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { ScrollText, ShieldCheck } from "lucide-react";
import type { AuditFilters as AuditFilterValues, AuditRow } from "./lib/audit-query";
import { AuditEventList } from "./components/AuditEventList";
import { AuditFilters } from "./components/AuditFilters";
import { AuditPagination } from "./components/AuditPagination";
import { AuditStats } from "./components/AuditStats";
import { auditText } from "./i18n";
import { auditSelectors } from "./selectors";

type AuditPageViewProps = {
  filters: AuditFilterValues;
  pageCount: number;
  rows: AuditRow[];
  stats: { actors: number; today: number; total: number };
  viewerEmail: string;
};

export function AuditPageView({ filters, pageCount, rows, stats, viewerEmail }: AuditPageViewProps) {
  return (
    <Stack data-testid={auditSelectors.page} gap="lg">
      <Group align="flex-start" justify="space-between">
        <Group align="flex-start">
          <ThemeIcon color="teal" radius="lg" size={48} variant="light"><ScrollText size={25} /></ThemeIcon>
          <div>
            <Text c="teal" fw={800} size="xs" tt="uppercase">{auditText.page.audit}</Text>
            <Title order={1}>{auditText.page.title}</Title>
            <Text c="dimmed" mt={4}>{auditText.page.subtitle}</Text>
          </div>
        </Group>
        <Badge color="teal" leftSection={<ShieldCheck size={14} />} size="lg" variant="light">
          {viewerEmail}
        </Badge>
      </Group>
      <AuditStats stats={stats} />
      <AuditFilters filters={filters} />
      <AuditEventList rows={rows} />
      <AuditPagination filters={filters} pageCount={pageCount} />
    </Stack>
  );
}
