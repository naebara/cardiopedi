"use client";

import { useMemo, useState } from "react";
import { ActionIcon, Button, Group, SegmentedControl, TextInput } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { CalendarDays, ChevronLeft, ChevronRight, List as ListIcon, Search } from "lucide-react";
import { AdminCalendarGrid } from "./components/AdminCalendarGrid";
import { AdminMonthGrid } from "./components/AdminMonthGrid";
import { AdminAppointmentsList, type Appointment } from "./components/AdminAppointmentsList";
import { AppointmentDetailsModal, AppointmentDetailsPanel } from "./components/AppointmentDetailsModal";
import { dateValue, getDatesOfWeek, monthLabel } from "./lib/admin-calendar-utils";
import styles from "./programari.module.css";

type Period = "day" | "week" | "month";
type Mode = "calendar" | "list";

export type AppointmentScheduleSlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMin: number;
};

function appointmentMatchesSearch(appointment: Appointment, search: string) {
  const normalized = search.trim().toLocaleLowerCase("ro-RO");

  if (!normalized) {
    return true;
  }

  return [
    appointment.childName,
    appointment.parentName,
    appointment.service,
    appointment.phone,
    appointment.email ?? "",
    appointment.notes ?? "",
    appointment.status,
    appointment.date,
    appointment.time,
  ].some((value) => value.toLocaleLowerCase("ro-RO").includes(normalized));
}

export function AppointmentsPanel({
  appointments,
  canManageAppointments,
  scheduleSlots,
}: {
  appointments: Appointment[];
  canManageAppointments: boolean;
  scheduleSlots: AppointmentScheduleSlot[];
}) {
  const [mode, setMode] = useState<Mode>("calendar");
  const [period, setPeriod] = useState<Period>("week");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const isDesktop = useMediaQuery("(min-width: 1024px)", false);
  const useCalendarSplit = mode === "calendar" && period !== "month" && isDesktop;
  const selected = useMemo(() => {
    return selectedId ? appointments.find((appointment) => appointment.id === selectedId) ?? null : null;
  }, [appointments, selectedId]);

  const goNext = () => {
    setSelectedId(null);
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (period === "month") next.setMonth(prev.getMonth() + 1);
      else if (period === "week") next.setDate(prev.getDate() + 7);
      else next.setDate(prev.getDate() + 1);
      return next;
    });
  };

  const goPrev = () => {
    setSelectedId(null);
    setCurrentDate((prev) => {
      const prevDate = new Date(prev);
      if (period === "month") prevDate.setMonth(prev.getMonth() - 1);
      else if (period === "week") prevDate.setDate(prev.getDate() - 7);
      else prevDate.setDate(prev.getDate() - 1);
      return prevDate;
    });
  };

  const goToday = () => {
    setSelectedId(null);
    setCurrentDate(new Date());
  };

  function changePeriod(value: string) {
    setSelectedId(null);
    setPeriod(value as Period);
  }

  function changeMode(value: string) {
    setSelectedId(null);
    setMode(value as Mode);
  }

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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => appointmentMatchesSearch(appointment, search));
  }, [appointments, search]);

  const periodAppointments = useMemo(() => {
    if (period === "day") {
      const key = dateValue(currentDate);
      return filteredAppointments.filter((apt) => apt.date === key);
    }

    if (period === "week") {
      const keys = new Set(getDatesOfWeek(currentDate).map(dateValue));
      return filteredAppointments.filter((apt) => keys.has(apt.date));
    }

    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    return filteredAppointments.filter((apt) => apt.date.startsWith(monthKey));
  }, [filteredAppointments, period, currentDate]);

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
          <TextInput
            className={styles.searchInput}
            leftSection={<Search size={16} />}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Cauta copil, parinte, serviciu"
            size="sm"
            value={search}
          />
          <SegmentedControl
            className={`${styles.segmented} ${styles.periodSegmented}`}
            size="sm"
            value={period}
            onChange={changePeriod}
            data={[
              { label: "Azi", value: "day" },
              { label: "Săptămână", value: "week" },
              { label: "Lună", value: "month" },
            ]}
          />
          <SegmentedControl
            className={`${styles.segmented} ${styles.modeSegmented}`}
            size="sm"
            value={mode}
            onChange={changeMode}
            data={[
              {
                label: (
                  <Group className={styles.segmentLabel} gap={6} wrap="nowrap" justify="center">
                    <CalendarDays size={15} />
                    <span>Calendar</span>
                  </Group>
                ),
                value: "calendar",
              },
              {
                label: (
                  <Group className={styles.segmentLabel} gap={6} wrap="nowrap" justify="center">
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
          <AdminAppointmentsList appointments={periodAppointments} onSelect={(appointment) => setSelectedId(appointment.id)} />
        ) : useCalendarSplit ? (
          <div className={styles.daySplitLayout}>
            <div className={styles.daySplitCalendar}>
              <AdminCalendarGrid
                appointments={filteredAppointments}
                canManageAppointments={canManageAppointments}
                currentDate={currentDate}
                occupiedAppointments={appointments}
                onSelect={(appointment) => setSelectedId(appointment.id)}
                scheduleSlots={scheduleSlots}
                selectedAppointmentId={selectedId}
                view={period}
              />
            </div>
            <div className={styles.daySplitDetails}>
              <AppointmentDetailsPanel appointment={selected} canManageAppointments={canManageAppointments} onClose={() => setSelectedId(null)} />
            </div>
          </div>
        ) : period === "month" ? (
          <div className={styles.monthScroll}>
            <AdminMonthGrid currentDate={currentDate} appointments={filteredAppointments} onSelect={(appointment) => setSelectedId(appointment.id)} />
          </div>
        ) : (
          <div className={styles.calendarScroll}>
            <AdminCalendarGrid
              appointments={filteredAppointments}
              canManageAppointments={canManageAppointments}
              currentDate={currentDate}
              occupiedAppointments={appointments}
              onSelect={(appointment) => setSelectedId(appointment.id)}
              scheduleSlots={scheduleSlots}
              selectedAppointmentId={selectedId}
              view={period}
            />
          </div>
        )}
      </div>

      {!useCalendarSplit ? (
        <AppointmentDetailsModal appointment={selected} canManageAppointments={canManageAppointments} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}
