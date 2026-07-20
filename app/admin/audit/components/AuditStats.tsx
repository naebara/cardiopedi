import { Group, Paper, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import { Activity, CalendarClock, UsersRound } from "lucide-react";
import { auditText } from "../i18n";
import { auditSelectors } from "../selectors";

const cards = [
  { color: "blue", icon: Activity, key: "total", label: auditText.page.total },
  { color: "teal", icon: CalendarClock, key: "today", label: auditText.page.today },
  { color: "violet", icon: UsersRound, key: "actors", label: auditText.page.actors },
] as const;

export function AuditStats({ stats }: { stats: { actors: number; today: number; total: number } }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} data-testid={auditSelectors.stats} spacing="md">
      {cards.map(({ color, icon: Icon, key, label }) => (
        <Paper key={key} p="lg" radius="lg" shadow="xs" withBorder>
          <Group justify="space-between">
            <div>
              <Text c="dimmed" fw={700} size="xs" tt="uppercase">{label}</Text>
              <Text fw={800} mt={4} size="xl">{stats[key].toLocaleString("ro-RO")}</Text>
            </div>
            <ThemeIcon color={color} radius="xl" size={42} variant="light"><Icon size={21} /></ThemeIcon>
          </Group>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
