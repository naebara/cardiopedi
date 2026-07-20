import { Button, Group, NativeSelect, Paper, SimpleGrid, TextInput } from "@mantine/core";
import { Filter, RotateCcw, Search } from "lucide-react";
import type { AuditFilters as AuditFilterValues } from "../lib/audit-query";
import { auditText } from "../i18n";
import { auditSelectors } from "../selectors";

const categoryOptions = Object.entries(auditText.categories).map(([value, label]) => ({
  label,
  value: value === "ALL" ? "" : value,
}));

const actionOptions = [
  { label: auditText.page.allActions, value: "" },
  ...Object.entries(auditText.actions)
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label, "ro")),
];

const statusOptions = Object.entries(auditText.statuses).map(([value, label]) => ({
  label,
  value: value === "ALL" ? "" : value,
}));

export function AuditFilters({ filters }: { filters: AuditFilterValues }) {
  return (
    <Paper component="form" action="/admin/audit" data-testid={auditSelectors.filters} method="get" p="lg" radius="lg" shadow="xs" withBorder>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <TextInput
          defaultValue={filters.q}
          label={auditText.page.search}
          leftSection={<Search size={16} />}
          name="q"
          placeholder={auditText.page.searchPlaceholder}
        />
        <NativeSelect data={categoryOptions} defaultValue={filters.category} label={auditText.page.category} name="category" />
        <NativeSelect data={actionOptions} defaultValue={filters.action} label={auditText.page.action} name="action" />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mt="md" spacing="md" style={{ alignItems: "end" }}>
        <NativeSelect data={statusOptions} defaultValue={filters.status} label={auditText.page.result} name="status" />
        <TextInput defaultValue={filters.from} label={auditText.page.from} name="from" type="date" />
        <TextInput defaultValue={filters.to} label={auditText.page.to} name="to" type="date" />
        <div>
          <Group gap="sm" justify="flex-end">
            <Button component="a" href="/admin/audit" leftSection={<RotateCcw size={16} />} variant="default">
              {auditText.page.reset}
            </Button>
            <Button leftSection={<Filter size={16} />} type="submit">
              {auditText.page.apply}
            </Button>
          </Group>
        </div>
      </SimpleGrid>
    </Paper>
  );
}
