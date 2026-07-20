import { Badge, Box, Code, Divider, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { AlertTriangle, Check, ChevronDown, Clock3, ShieldAlert } from "lucide-react";
import type { AuditRow } from "../lib/audit-query";
import { auditSentence } from "../lib/audit-language";
import { auditText } from "../i18n";
import { auditSelectors } from "../selectors";

const categoryColors: Record<string, string> = {
  APPOINTMENTS: "blue", AUTH: "violet", PATIENTS: "cyan", SCHEDULE: "orange",
  SECURITY: "red", SERVICES: "teal", USERS: "grape",
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return auditText.page.notAvailable;
  if (typeof value === "boolean") return value ? auditText.page.yes : auditText.page.no;
  if (Array.isArray(value)) return value.length ? value.join(", ") : auditText.page.notAvailable;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function eventDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/Bucharest",
  }).format(new Date(value));
}

function labelFor<T extends Record<string, string>>(values: T, key: string) {
  return values[key as keyof T] ?? key.replaceAll("_", " ").toLowerCase();
}

function AuditDetails({ row }: { row: AuditRow }) {
  const changes = Object.entries(row.changes ?? {});
  const metadata = Object.entries(row.metadata ?? {});

  return (
    <Box data-testid={auditSelectors.eventDetails(row.id)} mt="md">
      <Divider mb="md" />
      {row.entityId ? (
        <Group gap="xs" mb="md"><Text c="dimmed" size="sm">{row.entityType}</Text><Code>{row.entityId}</Code></Group>
      ) : null}
      {changes.length ? (
        <Stack gap="xs">
          {changes.map(([field, change]) => (
            <Paper bg="gray.0" key={field} p="sm" radius="md">
              <Text fw={700} mb={5} size="sm">{labelFor(auditText.fields, field)}</Text>
              <Group align="center" gap="xs" wrap="nowrap">
                <Code c="red" style={{ overflowWrap: "anywhere" }}>{displayValue(change.before)}</Code>
                <Text c="dimmed">→</Text>
                <Code c="teal" style={{ overflowWrap: "anywhere" }}>{displayValue(change.after)}</Code>
              </Group>
            </Paper>
          ))}
        </Stack>
      ) : <Text c="dimmed" size="sm">{auditText.page.noChanges}</Text>}
      {metadata.length ? (
        <Group gap="xs" mt="md">
          {metadata.map(([field, value]) => (
            <Badge color="gray" key={field} size="lg" variant="light">
              {labelFor(auditText.fields, field)}: {displayValue(value)}
            </Badge>
          ))}
        </Group>
      ) : null}
    </Box>
  );
}

export function AuditEventList({ rows }: { rows: AuditRow[] }) {
  if (!rows.length) {
    return <Paper data-testid={auditSelectors.list} p="xl" radius="lg" ta="center" withBorder><Text c="dimmed">{auditText.page.empty}</Text></Paper>;
  }

  return (
    <Stack data-testid={auditSelectors.list} gap="sm">
      {rows.map((row) => {
        const failed = row.status !== "SUCCESS";
        const StatusIcon = row.status === "DENIED" ? ShieldAlert : failed ? AlertTriangle : Check;
        return (
          <Paper component="details" data-testid={auditSelectors.event(row.id)} key={row.id} p="md" radius="lg" shadow="xs" withBorder>
            <Box component="summary" style={{ cursor: "pointer", listStyle: "none" }}>
              <Group align="flex-start" justify="space-between" wrap="nowrap">
                <Group align="flex-start" wrap="nowrap">
                  <ThemeIcon color={failed ? "red" : categoryColors[row.category] ?? "gray"} radius="xl" size={38} variant="light">
                    <StatusIcon size={19} />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Badge color={failed ? "red" : "gray"} size="sm" variant="light">
                        {labelFor(auditText.actions, row.action)}
                      </Badge>
                      <Badge color={categoryColors[row.category] ?? "gray"} size="sm" variant="light">
                        {labelFor(auditText.categories, row.category)}
                      </Badge>
                    </Group>
                    <Text fw={650} mt={8}>{auditSentence(row)}</Text>
                  </div>
                </Group>
                <Group gap={6} wrap="nowrap">
                  <Clock3 size={14} />
                  <Text c="dimmed" size="xs" style={{ whiteSpace: "nowrap" }}>{eventDate(row.createdAt)}</Text>
                  <ChevronDown size={16} />
                </Group>
              </Group>
            </Box>
            <AuditDetails row={row} />
          </Paper>
        );
      })}
    </Stack>
  );
}
