import { Box, Text } from "@mantine/core";
import { dateValue, getDatesOfMonthView, labelDateShort } from "../lib/admin-calendar-utils";
import type { Appointment } from "./AdminAppointmentsList";

interface AdminMonthGridProps {
  currentDate: Date;
  appointments: Appointment[];
  onSelect?: (appointment: Appointment) => void;
}

export function AdminMonthGrid({ currentDate, appointments, onSelect }: AdminMonthGridProps) {
  const dates = getDatesOfMonthView(currentDate);

  const groupedByDate = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    groupedByDate.set(apt.date, [...(groupedByDate.get(apt.date) || []), apt]);
  }

  // Get only first 7 dates for headers
  const weekDays = dates.slice(0, 7);
  const currentMonth = currentDate.getMonth();

  return (
    <Box bg="white" style={{ border: "1px solid #e9ecef", borderRadius: "8px", overflow: "hidden" }}>
      {/* Header Row - Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e9ecef", backgroundColor: "#f8f9fa" }}>
        {weekDays.map((date) => (
          <div key={date.toISOString()} style={{ padding: "8px", textAlign: "center", borderLeft: "1px solid #e9ecef" }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {labelDateShort(date)}
            </Text>
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(120px, auto)" }}>
        {dates.map((date) => {
          const val = dateValue(date);
          const dayAppointments = groupedByDate.get(val) || [];
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = val === dateValue(new Date());

          return (
            <div key={val} style={{ borderBottom: "1px solid #e9ecef", borderLeft: "1px solid #e9ecef", padding: "4px", backgroundColor: isCurrentMonth ? "#fff" : "#fafafa" }}>
              <Box mb={4} ta="right">
                <Box
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: isToday ? "var(--mantine-color-blue-6)" : "transparent",
                    color: isToday ? "white" : (isCurrentMonth ? "inherit" : "var(--mantine-color-gray-5)"),
                  }}
                >
                  <Text size="sm" fw={isToday ? 700 : 500}>{date.getDate()}</Text>
                </Box>
              </Box>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {dayAppointments.map((apt) => {
                  let color = "blue";
                  if (apt.status === "Noua") color = "yellow";
                  if (apt.status === "Cancelata") color = "red";
                  if (apt.status === "Confirmata") color = "green";

                  return (
                    <Box
                      key={apt.id}
                      onClick={() => onSelect?.(apt)}
                      style={{
                        backgroundColor: `var(--mantine-color-${color}-1)`,
                        borderLeft: `3px solid var(--mantine-color-${color}-6)`,
                        borderRadius: "4px",
                        padding: "2px 6px",
                        cursor: "pointer",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <Text size="xs" fw={700} c={`${color}.9`} component="span" mr={4}>{apt.time}</Text>
                      <Text size="xs" c={`${color}.9`} component="span">{apt.childName}</Text>
                    </Box>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Box>
  );
}
