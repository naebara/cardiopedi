"use client";

import { useState } from "react";
import { ActionIcon, Button, Group, Title } from "@mantine/core";
import { ChevronLeft, ChevronRight, List as ListIcon } from "lucide-react";
import { AdminCalendarGrid } from "./components/AdminCalendarGrid";
import { AdminMonthGrid } from "./components/AdminMonthGrid";
import { AdminAppointmentsList, type Appointment } from "./components/AdminAppointmentsList";
import { monthLabel } from "./lib/admin-calendar-utils";

export function AppointmentsPanel({ appointments }: { appointments: Appointment[] }) {
  const [view, setView] = useState<"day" | "week" | "month" | "list">("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const goNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(prev.getMonth() + 1);
      else if (view === "week") next.setDate(prev.getDate() + 7);
      else next.setDate(prev.getDate() + 1); // day or list
      return next;
    });
  };

  const goPrev = () => {
    setCurrentDate((prev) => {
      const prevDate = new Date(prev);
      if (view === "month") prevDate.setMonth(prev.getMonth() - 1);
      else if (view === "week") prevDate.setDate(prev.getDate() - 7);
      else prevDate.setDate(prev.getDate() - 1); // day or list
      return prevDate;
    });
  };

  const goToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "16px 24px", backgroundColor: "#fff" }}>
      {/* Calendar Toolbar */}
      <Group justify="space-between" mb="lg">
        <Group>
          <Title order={3} size="h3" fw={600}>
            {monthLabel(currentDate)}
            {view === "day" && `, ${currentDate.getDate()}`}
          </Title>
        </Group>

        <Group gap="md">
          <Group gap="xs">
            <Button variant="default" size="sm" onClick={goToday}>
              Astăzi
            </Button>
            <Group gap={0}>
              <ActionIcon 
                variant="default" 
                size="lg" 
                onClick={goPrev} 
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              >
                <ChevronLeft size={18} />
              </ActionIcon>
              <ActionIcon 
                variant="default" 
                size="lg" 
                onClick={goNext}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              >
                <ChevronRight size={18} />
              </ActionIcon>
            </Group>
          </Group>

          <Group gap={0}>
            <Button 
              variant={view === "day" ? "filled" : "default"} 
              size="sm" 
              onClick={() => setView("day")}
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            >
              Zi
            </Button>
            <Button 
              variant={view === "week" ? "filled" : "default"} 
              size="sm" 
              onClick={() => setView("week")}
              style={{ borderRadius: 0, borderLeft: 0 }}
            >
              Săpt
            </Button>
            <Button 
              variant={view === "month" ? "filled" : "default"} 
              size="sm" 
              onClick={() => setView("month")}
              style={{ borderRadius: 0, borderLeft: 0 }}
            >
              Lună
            </Button>
            <Button 
              variant={view === "list" ? "filled" : "default"} 
              size="sm" 
              onClick={() => setView("list")}
              leftSection={<ListIcon size={16} />}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 0 }}
            >
              Listă
            </Button>
          </Group>
        </Group>
      </Group>

      {/* Main Content Area */}
      {view === "month" ? (
        <AdminMonthGrid currentDate={currentDate} appointments={appointments} />
      ) : view === "day" || view === "week" ? (
        <AdminCalendarGrid currentDate={currentDate} view={view} appointments={appointments} />
      ) : (
        <AdminAppointmentsList appointments={appointments} />
      )}
    </div>
  );
}
