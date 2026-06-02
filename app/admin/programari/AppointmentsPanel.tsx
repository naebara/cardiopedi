"use client";

import { useMemo, useState } from "react";
import { ActionIcon, Button, Group, SegmentedControl } from "@mantine/core";
import { CalendarDays, ChevronLeft, ChevronRight, List as ListIcon } from "lucide-react";
import { AdminCalendarGrid } from "./components/AdminCalendarGrid";
import { AdminMonthGrid } from "./components/AdminMonthGrid";
import { AdminAppointmentsList, type Appointment } from "./components/AdminAppointmentsList";
import { AppointmentDetailsModal } from "./components/AppointmentDetailsModal";
import { dateValue, getDatesOfWeek, monthLabel } from "./lib/admin-calendar-utils";
import styles from "./programari.module.css";

type Period = "day" | "week" | "month";
type Mode = "calendar" | "list";

export function AppointmentsPanel({ appointments }: { appointments: Appointment[] }) {
  const [mode, setMode] = useState<Mode>("calendar");
  const [period, setPeriod] = useState<Period>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);

  const goNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (period === "month") next.setMonth(prev.getMonth() + 1);
      else if (period === "week") next.setDate(prev.getDate() + 7);
      else next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const goPrev = () => {
    setCurrentDate((prev) => {
      const prevDate = new Date(prev);
      if (period === "month") prevDate.setMonth(prev.getMonth() - 1);
      else if (period === "week") prevDate.setDate(prev.getDate() - 7);
      else prevDate.setDate(prev.getDate() - 1);
      return prevDate;
    });
  };

  const goToday = () => setCurrentDate(new Date());

  const periodLabel = useMemo(() => {
    if (period === "day") {
      return `${currentDate.getDate()} ${monthLabel(currentDate)}`;
    }

    if (period === "week") {
      const dates = getDatesOfWeek(currentDate);
      const start = dates[0];
      const end = dates[6];
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} – ${end.getDate()} ${monthLabel(start)}`;
      }
      return `${start.getDate()} ${monthLabel(start)} – ${end.getDate()} ${monthLabel(end)}`;
    }

    return monthLabel(currentDate);
  }, [period, currentDate]);

  const periodAppointments = useMemo(() => {
    if (period === "day") {
      const key = dateValue(currentDate);
      return appointments.filter((apt) => apt.date === key);
    }

    if (period === "week") {
      const keys = new Set(getDatesOfWeek(currentDate).map(dateValue));
      return appointments.filter((apt) => keys.has(apt.date));
    }

    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    return appointments.filter((apt) => apt.date.startsWith(monthKey));
  }, [appointments, period, currentDate]);

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h3 className={styles.toolbarTitle}>{periodLabel}</h3>
          <div className={styles.nav}>
            <Button variant="default" size="sm" onClick={goToday}>
              Astăzi
            </Button>
            <Group gap={0}>
              <ActionIcon
                variant="default"
                size="lg"
                onClick={goPrev}
                aria-label="Perioada anterioară"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
              >
                <ChevronLeft size={18} />
              </ActionIcon>
              <ActionIcon
                variant="default"
                size="lg"
                onClick={goNext}
                aria-label="Perioada următoare"
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
              >
                <ChevronRight size={18} />
              </ActionIcon>
            </Group>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <SegmentedControl
            className={styles.segmented}
            size="sm"
            value={period}
            onChange={(value) => setPeriod(value as Period)}
            data={[
              { label: "Azi", value: "day" },
              { label: "Săptămână", value: "week" },
              { label: "Lună", value: "month" },
            ]}
          />
          <SegmentedControl
            className={styles.segmented}
            size="sm"
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            data={[
              {
                label: (
                  <Group gap={6} wrap="nowrap" justify="center">
                    <CalendarDays size={15} />
                    <span>Calendar</span>
                  </Group>
                ),
                value: "calendar",
              },
              {
                label: (
                  <Group gap={6} wrap="nowrap" justify="center">
                    <ListIcon size={15} />
                    <span>Listă</span>
                  </Group>
                ),
                value: "list",
              },
            ]}
          />
        </div>
      </div>

      <div className={styles.viewArea}>
        {mode === "list" ? (
          <AdminAppointmentsList appointments={periodAppointments} onSelect={setSelected} />
        ) : period === "month" ? (
          <div className={styles.monthScroll}>
            <AdminMonthGrid currentDate={currentDate} appointments={appointments} onSelect={setSelected} />
          </div>
        ) : (
          <div className={styles.calendarScroll}>
            <AdminCalendarGrid currentDate={currentDate} view={period} appointments={appointments} onSelect={setSelected} />
          </div>
        )}
      </div>

      <AppointmentDetailsModal appointment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
