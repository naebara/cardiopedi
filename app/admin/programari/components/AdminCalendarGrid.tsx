import { Box, Popover, Text, Group } from "@mantine/core";
import { Info, Phone, UserRound } from "lucide-react";
import { dateValue, getDatesOfWeek, labelDateShort, calculateEventPosition } from "../lib/admin-calendar-utils";
import type { Appointment } from "./AdminAppointmentsList";

interface AdminCalendarGridProps {
  currentDate: Date; // represents the day or week we are looking at
  view: "day" | "week";
  appointments: Appointment[];
}

const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 60; // 60px height per hour => 1 minute = 1px

export function AdminCalendarGrid({ currentDate, view, appointments }: AdminCalendarGridProps) {
  const dates = view === "day" ? [currentDate] : getDatesOfWeek(currentDate);

  // Group appointments by date string
  const groupedByDate = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    groupedByDate.set(apt.date, [...(groupedByDate.get(apt.date) || []), apt]);
  }

  return (
    <Box bg="white" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Header Row - Days */}
      <div style={{ display: "flex", borderBottom: "1px solid #e9ecef", backgroundColor: "#f8f9fa", padding: "8px 0" }}>
        {/* Empty top-left cell for time column */}
        <div style={{ width: "60px", flexShrink: 0 }} />
        
        {/* Days */}
        <div style={{ display: "flex", flexGrow: 1 }}>
          {dates.map((date) => {
            const isToday = dateValue(date) === dateValue(new Date());
            return (
              <div key={date.toISOString()} style={{ flex: 1, textAlign: "center", borderLeft: "1px solid transparent" }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  {labelDateShort(date)}
                </Text>
                <Box
                  mx="auto"
                  mt={4}
                  w={32}
                  h={32}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    backgroundColor: isToday ? "var(--mantine-color-blue-6)" : "transparent",
                    color: isToday ? "white" : "inherit",
                  }}
                >
                  <Text size="sm" fw={isToday ? 700 : 400}>
                    {date.getDate()}
                  </Text>
                </Box>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Body */}
      <div style={{ position: "relative", flex: 1, overflowY: "auto", display: "flex", paddingTop: "12px" }}>
        
        {/* Time Column */}
        <div style={{ width: "60px", flexShrink: 0, position: "relative", backgroundColor: "#fff" }}>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
            const hour = START_HOUR + i;
            return (
              <div key={hour} style={{ height: `${PIXELS_PER_HOUR}px`, position: "relative" }}>
                <Text size="xs" c="dimmed" style={{ position: "absolute", top: "-10px", right: "8px" }}>
                  {hour.toString().padStart(2, "0")}:00
                </Text>
              </div>
            );
          })}
        </div>

        {/* Days Columns */}
        <div style={{ display: "flex", flexGrow: 1, position: "relative" }}>
          {/* Background grid lines */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
              <div key={i} style={{ height: `${PIXELS_PER_HOUR}px`, borderTop: "1px solid #f1f3f5" }} />
            ))}
          </div>

          {/* Actual columns and events */}
          {dates.map((date) => {
            const val = dateValue(date);
            const dayAppointments = groupedByDate.get(val) || [];

            return (
              <div key={val} style={{ flex: 1, position: "relative", borderLeft: "1px solid #f1f3f5" }}>
                {dayAppointments.map((apt) => {
                  const durationMin = 30; // Implicit duration since we only have `time` in our mock data
                  const { top, height } = calculateEventPosition(apt.time, durationMin, START_HOUR, PIXELS_PER_HOUR);

                  let color = "blue";
                  if (apt.status === "Noua") color = "yellow";
                  if (apt.status === "Cancelata") color = "red";
                  if (apt.status === "Confirmata") color = "green";

                  return (
                    <Popover key={apt.id} width={280} position="right" withArrow shadow="md">
                      <Popover.Target>
                        <Box
                          style={{
                            position: "absolute",
                            top: `${top}px`,
                            left: "4px",
                            right: "4px",
                            height: `${height}px`,
                            backgroundColor: `var(--mantine-color-${color}-1)`,
                            borderLeft: `4px solid var(--mantine-color-${color}-6)`,
                            borderRadius: "4px",
                            padding: "2px 6px",
                            cursor: "pointer",
                            overflow: "hidden",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}
                        >
                          <Text size="xs" fw={700} c={`${color}.9`} lh={1.2}>{apt.time}</Text>
                          <Text size="xs" c={`${color}.9`} lh={1.1} truncate>{apt.childName}</Text>
                        </Box>
                      </Popover.Target>
                      <Popover.Dropdown p="sm">
                        <Text size="sm" fw={600} mb="xs">{apt.service}</Text>
                        <Group gap="xs" mb={4}>
                          <UserRound size={14} className="mantine-text-dimmed" />
                          <Text size="xs">Copil: {apt.childName}</Text>
                        </Group>
                        <Group gap="xs" mb={4}>
                          <UserRound size={14} className="mantine-text-dimmed" />
                          <Text size="xs">Părinte: {apt.parentName}</Text>
                        </Group>
                        <Group gap="xs" mb={4}>
                          <Phone size={14} className="mantine-text-dimmed" />
                          <Text size="xs">{apt.phone}</Text>
                        </Group>
                        <Group gap="xs" mt="sm">
                          <Info size={14} className="mantine-text-dimmed" />
                          <Text size="xs" fw={500} c={`${color}.7`}>Status: {apt.status}</Text>
                        </Group>
                      </Popover.Dropdown>
                    </Popover>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </Box>
  );
}
