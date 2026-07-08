import { useMemo, useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Box, Text } from "@mantine/core";
import { rescheduleAppointment } from "@/app/admin/actions";
import { dateValue, getDatesOfWeek, labelDateShort, calculateEventPosition, toMinutes } from "../lib/admin-calendar-utils";
import type { AppointmentBlockedPeriod, AppointmentScheduleSlot } from "../AppointmentsPanel";
import type { AdminAppointmentDraftSlot } from "./AdminCreateAppointmentModal";
import type { Appointment } from "./AdminAppointmentsList";
import styles from "../programari.module.css";

interface AdminCalendarGridProps {
  currentDate: Date; // represents the day or week we are looking at
  view: "day" | "week";
  appointments: Appointment[];
  blockedPeriods: AppointmentBlockedPeriod[];
  canManageAppointments: boolean;
  occupiedAppointments: Appointment[];
  onCreateSlot?: (slot: AdminAppointmentDraftSlot) => void;
  onSelect?: (appointment: Appointment) => void;
  scheduleSlots: AppointmentScheduleSlot[];
  selectedAppointmentId?: string | null;
}

const CLINIC_TIME_ZONE = "Europe/Bucharest";
const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 60; // 60px height per hour => 1 minute = 1px
const DROP_SLOT_DURATION_MIN = 30;

function toTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function buildSlots(start: string, end: string, durationMin: number) {
  const slots = [];
  const close = toMinutes(end);
  for (let time = toMinutes(start); time + durationMin <= close; time += durationMin) {
    slots.push(toTime(time));
  }
  return slots;
}

function getClinicNow(reference = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
  }).formatToParts(reference);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const hour = Number(part("hour"));
  const minute = Number(part("minute"));

  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: hour * 60 + minute,
  };
}

function isPastAppointmentSlot(date: string, time: string, clinicNow: ReturnType<typeof getClinicNow>) {
  return date < clinicNow.date || (date === clinicNow.date && toMinutes(time) <= clinicNow.minutes);
}

function isSlotBlocked(periods: AppointmentBlockedPeriod[], date: string, time: string) {
  return periods.some((period) => {
    if (date < period.date || date > period.endDate) {
      return false;
    }

    if (!period.startTime || !period.endTime || period.date !== period.endDate) {
      return true;
    }

    return time >= period.startTime && time < period.endTime;
  });
}

export function AdminCalendarGrid({
  appointments,
  blockedPeriods,
  canManageAppointments,
  currentDate,
  occupiedAppointments,
  onCreateSlot,
  onSelect,
  scheduleSlots,
  selectedAppointmentId,
  view,
}: AdminCalendarGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dragTarget, setDragTarget] = useState<null | { date: string; isOutsideSchedule: boolean; time: string }>(null);
  const [isDragging, setIsDragging] = useState(false);
  const draggedAppointmentIdRef = useRef<string | null>(null);
  const suppressNextClickRef = useRef(false);
  const dates = view === "day" ? [currentDate] : getDatesOfWeek(currentDate);
  const clinicNow = useMemo(() => getClinicNow(), []);
  const activeScheduleSlots = scheduleSlots.filter((slot) => {
    const startMinutes = toMinutes(slot.startTime);
    const endMinutes = toMinutes(slot.endTime);
    return endMinutes > START_HOUR * 60 && startMinutes < END_HOUR * 60;
  });

  // Group appointments by date string
  const groupedByDate = new Map<string, Appointment[]>();
  for (const apt of appointments) {
    groupedByDate.set(apt.date, [...(groupedByDate.get(apt.date) || []), apt]);
  }
  const occupiedSlotValues = new Set(occupiedAppointments.map((apt) => `${apt.date}|${apt.time}`));
  const selectedAppointment = selectedAppointmentId
    ? occupiedAppointments.find((apt) => apt.id === selectedAppointmentId)
    : null;
  const visibleGridSlots = useMemo(() => {
    return Array.from({ length: ((END_HOUR - START_HOUR) * 60) / DROP_SLOT_DURATION_MIN }, (_, index) => {
      const time = START_HOUR * 60 + index * DROP_SLOT_DURATION_MIN;
      return toTime(time);
    });
  }, []);

  function getMatchingScheduleSlot(date: Date, time: string) {
    return activeScheduleSlots
      .filter((slot) => slot.dayOfWeek === date.getDay())
      .find((slot) => buildSlots(slot.startTime, slot.endTime, slot.durationMin).includes(time));
  }

  function onDragStart(event: DragEvent<HTMLDivElement>, appointment: Appointment) {
    if (!canManageAppointments) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", appointment.id);
    draggedAppointmentIdRef.current = appointment.id;
    suppressNextClickRef.current = true;
    setIsDragging(true);
    onSelect?.(appointment);
  }

  function onDragEnd() {
    draggedAppointmentIdRef.current = null;
    setIsDragging(false);
    setDragTarget(null);
    window.setTimeout(() => {
      suppressNextClickRef.current = false;
    }, 0);
  }

  function onDrop(event: DragEvent<HTMLDivElement>, date: string, time: string, isOutsideSchedule: boolean) {
    event.preventDefault();
    setDragTarget(null);
    const appointmentId = event.dataTransfer.getData("text/plain");

    if (!appointmentId || isPending) {
      return;
    }

    const appointment = occupiedAppointments.find((apt) => apt.id === appointmentId);
    if (!appointment || (appointment.date === date && appointment.time === time)) {
      return;
    }

    if (isOutsideSchedule) {
      const confirmed = window.confirm(`Slotul ${date} la ${time} este in afara programului clinic. Confirmi mutarea ca exceptie aprobata de medic?`);
      if (!confirmed) {
        return;
      }
    }

    startTransition(async () => {
      const result = await rescheduleAppointment(appointmentId, date, time, isOutsideSchedule);
      if (result.status === "error") {
        window.alert(result.message);
        return;
      }
      router.refresh();
    });
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
            const dayDropSlots = visibleGridSlots.map((time) => {
              const matchingScheduleSlot = getMatchingScheduleSlot(date, time);
              return {
                durationMin: matchingScheduleSlot?.durationMin ?? DROP_SLOT_DURATION_MIN,
                id: `${val}-${time}`,
                isOutsideSchedule: !matchingScheduleSlot,
                time,
              };
            });
            const dayScheduleRanges = activeScheduleSlots
              .filter((slot) => slot.dayOfWeek === date.getDay())
              .map((slot) => {
                const start = Math.max(toMinutes(slot.startTime), START_HOUR * 60);
                const end = Math.min(toMinutes(slot.endTime), END_HOUR * 60);
                return {
                  id: `${val}-${slot.id}`,
                  start,
                  end,
                };
              })
              .filter((range) => range.end > range.start);

            return (
              <div key={val} style={{ flex: 1, position: "relative", borderLeft: "1px solid #f1f3f5" }}>
                {dayScheduleRanges.map((range) => {
                  const top = ((range.start - START_HOUR * 60) / 60) * PIXELS_PER_HOUR;
                  const height = ((range.end - range.start) / 60) * PIXELS_PER_HOUR;
                  const isActiveDay = isDragging && dragTarget?.date === val;

                  return (
                    <div
                      className={`${styles.scheduleDropRange} ${isActiveDay ? styles.scheduleDropRangeActive : ""}`}
                      key={range.id}
                      style={{
                        height: `${height}px`,
                        top: `${top}px`,
                      }}
                    />
                  );
                })}
                {canManageAppointments ? dayDropSlots.map((slot) => {
                  const isCurrentSelectedSlot = selectedAppointment?.date === val && selectedAppointment.time === slot.time;
                  const isOccupied = occupiedSlotValues.has(`${val}|${slot.time}`) && !isCurrentSelectedSlot;
                  if (isOccupied) {
                    return null;
                  }

                  const { top, height } = calculateEventPosition(slot.time, slot.durationMin, START_HOUR, PIXELS_PER_HOUR);
                  const isActiveTarget = dragTarget?.date === val && dragTarget.time === slot.time;
                  const isBlocked = isSlotBlocked(blockedPeriods, val, slot.time);
                  const isPast = isPastAppointmentSlot(val, slot.time, clinicNow);
                  const isBookable = Boolean(onCreateSlot) && !slot.isOutsideSchedule && !isBlocked && !isPast;

                  return (
                    <div
                      aria-disabled={!isBookable}
                      aria-label={isBookable ? `Creeaza programare la ${val} ${slot.time}` : `Interval indisponibil la ${val} ${slot.time}`}
                      className={[
                        styles.availableDropSlot,
                        isBookable ? styles.bookableDropSlot : "",
                        isBlocked || isPast ? styles.unavailableDropSlot : "",
                        slot.isOutsideSchedule ? styles.exceptionDropSlot : "",
                        isActiveTarget ? styles.activeDropSlot : "",
                      ].filter(Boolean).join(" ")}
                      key={slot.id}
                      onClick={() => {
                        if (!isBookable || isDragging || isPending) {
                          return;
                        }

                        onCreateSlot?.({ date: val, durationMin: slot.durationMin, time: slot.time });
                      }}
                      onDragEnter={() => setDragTarget({ date: val, isOutsideSchedule: slot.isOutsideSchedule, time: slot.time })}
                      onDragLeave={() => setDragTarget((current) => (current?.date === val && current.time === slot.time ? null : current))}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => onDrop(event, val, slot.time, slot.isOutsideSchedule)}
                      onKeyDown={(event) => {
                        if (!isBookable || isDragging || isPending || (event.key !== "Enter" && event.key !== " ")) {
                          return;
                        }

                        event.preventDefault();
                        onCreateSlot?.({ date: val, durationMin: slot.durationMin, time: slot.time });
                      }}
                      role={isBookable ? "button" : undefined}
                      style={{
                        height: `${height}px`,
                        top: `${top}px`,
                      }}
                      tabIndex={isBookable ? 0 : undefined}
                    />
                  );
                }) : null}
                {dayAppointments.map((apt) => {
                  const { top, height } = calculateEventPosition(apt.time, apt.durationMin, START_HOUR, PIXELS_PER_HOUR);
                  const isSelected = apt.id === selectedAppointmentId;

                  let color = "blue";
                  if (apt.status === "Noua") color = "yellow";
                  if (apt.status === "Cancelata") color = "red";
                  if (apt.status === "Confirmata") color = "green";

                  return (
                    <Box
                      key={apt.id}
                      className={`${styles.calendarEvent} ${isSelected ? styles.calendarEventSelected : ""}`}
                      draggable={canManageAppointments && !isPending}
                      onClick={() => {
                        if (suppressNextClickRef.current || draggedAppointmentIdRef.current === apt.id) {
                          return;
                        }
                        onSelect?.(apt);
                      }}
                      onDragEnd={onDragEnd}
                      onDragStart={(event) => onDragStart(event, apt)}
                      data-status={apt.status}
                      style={{
                        position: "absolute",
                        top: `${top}px`,
                        left: "4px",
                        right: "4px",
                        height: `${height}px`,
                        backgroundColor: `var(--mantine-color-${color}-1)`,
                        borderLeft: `4px solid var(--mantine-color-${color}-6)`,
                      }}
                    >
                      <Text size="xs" fw={700} c={`${color}.9`} lh={1.2}>{apt.time}</Text>
                      <Text size="xs" c={`${color}.9`} lh={1.1} truncate>{apt.childName}</Text>
                    </Box>
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
