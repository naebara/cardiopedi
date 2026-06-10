"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, HeartPulse, Info, Mail, Phone, Send, UserRound, X } from "lucide-react";
import { createAppointment, type AppointmentFormState } from "@/app/actions/appointments";
import { appointmentNotice } from "../site-data";
import styles from "../public-site.module.css";

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function labelDate(date: Date) {
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);

  return formatted.replace(/(^|,\s)(\p{L})/gu, (_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("ro-RO")}`);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildSlots(start: string, end: string, durationMin: number) {
  const slots = [];
  const close = toMinutes(end);
  for (let time = toMinutes(start); time + durationMin <= close; time += durationMin) {
    slots.push(toTime(time));
  }
  return slots;
}

type BookingServiceOption = {
  id: string;
  name: string;
};

type BookingScheduleOption = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMin: number;
};

type OccupiedSlot = {
  date: string;
  time: string;
};

const initialState: AppointmentFormState = {
  message: "",
  status: "idle",
};

function SubmitButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={styles.primaryButton} disabled={disabled || pending} type="submit">
      {pending ? (
        <>
          <span className={styles.buttonSpinner} aria-hidden="true" />
          Se trimite cererea...
        </>
      ) : (
        <>
          <Send size={18} />
          Trimite cererea de programare
        </>
      )}
    </button>
  );
}

export function BookingForm({
  occupiedSlots,
  schedule,
  services,
}: {
  occupiedSlots: OccupiedSlot[];
  schedule: BookingScheduleOption[];
  services: BookingServiceOption[];
}) {
  const [formState, formAction] = useActionState(createAppointment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const occupiedSlotValues = useMemo(() => new Set(occupiedSlots.map((slot) => `${slot.date}|${slot.time}`)), [occupiedSlots]);
  const scheduleByWeekday = useMemo(() => {
    return schedule.reduce<Record<number, BookingScheduleOption[]>>((acc, slot) => {
      acc[slot.dayOfWeek] = [...(acc[slot.dayOfWeek] ?? []), slot];
      return acc;
    }, {});
  }, [schedule]);

  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();

    for (let offset = 0; offset < 90; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      const daySlots = (scheduleByWeekday[date.getDay()] ?? []).flatMap((slot) => buildSlots(slot.startTime, slot.endTime, slot.durationMin));
      const freeSlots = daySlots.filter((slot) => !occupiedSlotValues.has(`${dateValue(date)}|${slot}`));

      if (freeSlots.length) {
        dates.push({
          value: dateValue(date),
          label: labelDate(date),
          weekday: date.getDay(),
        });
      }
    }

    return dates;
  }, [occupiedSlotValues, scheduleByWeekday]);

  const [selectedDate, setSelectedDate] = useState("");
  const [phone, setPhone] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = (availableDates[0]?.value ?? dateValue(new Date())).split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const availableDateValues = useMemo(() => new Set(availableDates.map((date) => date.value)), [availableDates]);
  const selectedDateMeta = availableDates.find((date) => date.value === selectedDate);
  const slots = selectedDateMeta
    ? (scheduleByWeekday[selectedDateMeta.weekday] ?? []).flatMap((slot) => buildSlots(slot.startTime, slot.endTime, slot.durationMin))
      .filter((slot) => !occupiedSlotValues.has(`${selectedDateMeta.value}|${slot}`))
    : [];
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (!isDatePickerOpen) {
      return;
    }

    function closeOnOutsideClick(event: PointerEvent) {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isDatePickerOpen]);

  function onDateChange(value: string) {
    setSelectedDate(value);
    const meta = availableDates.find((date) => date.value === value);
    const nextSlots = meta
      ? (scheduleByWeekday[meta.weekday] ?? []).flatMap((slot) => buildSlots(slot.startTime, slot.endTime, slot.durationMin))
        .filter((slot) => !occupiedSlotValues.has(`${meta.value}|${slot}`))
      : [];
    setSelectedTime(nextSlots[0] ?? "");
  }

  const selectedDateLabel = selectedDateMeta?.label ?? "";
  const calendarDates = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const mondayFirstOffset = (firstDay.getDay() + 6) % 7;
    const cells: Array<Date | null> = Array.from({ length: mondayFirstOffset }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarMonth]);

  const firstAvailableMonth = availableDates[0]
    ? new Date(Number(availableDates[0].value.slice(0, 4)), Number(availableDates[0].value.slice(5, 7)) - 1, 1)
    : calendarMonth;
  const lastAvailableMonth = availableDates.at(-1)
    ? new Date(Number(availableDates.at(-1)!.value.slice(0, 4)), Number(availableDates.at(-1)!.value.slice(5, 7)) - 1, 1)
    : calendarMonth;
  const canGoPrev = calendarMonth > firstAvailableMonth;
  const canGoNext = calendarMonth < lastAvailableMonth;

  useEffect(() => {
    if (formState.status !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsSuccessModalOpen(true);
      formRef.current?.reset();
      setSelectedDate("");
      setSelectedTime("");
      setPhone("");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [formState]);

  return (
    <>
      <form
        className={styles.bookingForm}
        action={formAction}
        ref={formRef}
      >
        <div className={styles.formGrid}>
          <label>
            <span><CalendarDays size={18} /> Data</span>
            <div className={styles.datePickerWrap} ref={datePickerRef}>
              <input
                aria-haspopup="dialog"
                onClick={() => setIsDatePickerOpen(true)}
                onFocus={() => setIsDatePickerOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsDatePickerOpen(false);
                }}
                placeholder="Selecteaza data"
                readOnly
                required
                disabled={availableDates.length === 0}
                type="text"
                value={selectedDateLabel}
              />
              <input name="date" type="hidden" value={selectedDate} />

              {isDatePickerOpen ? (
                <div className={styles.datePickerPopover} role="dialog" aria-label="Alege data programarii">
                  <div className={styles.datePickerHeader}>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
                      disabled={!canGoPrev}
                      aria-label="Luna precedenta"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <strong>{monthLabel(calendarMonth)}</strong>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
                      disabled={!canGoNext}
                      aria-label="Luna urmatoare"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className={styles.weekdayGrid} aria-hidden="true">
                    {["Lu", "Ma", "Mi", "Jo", "Vi", "Sa", "Du"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className={styles.monthGrid}>
                    {calendarDates.map((date, index) => {
                      if (!date) {
                        return <span className={styles.emptyDateCell} key={`empty-${index}`} />;
                      }

                      const value = dateValue(date);
                      const isAvailable = availableDateValues.has(value);
                      const isSelected = value === selectedDate;

                      return (
                        <button
                          className={isSelected ? styles.selectedCalendarDay : styles.calendarDay}
                          disabled={!isAvailable}
                          key={value}
                          onClick={() => onDateChange(value)}
                          type="button"
                          aria-pressed={isSelected}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </label>

        <label>
          <span><Clock size={18} /> Ora</span>
          <select name="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} required disabled={!selectedDate}>
            {!selectedDate ? <option value="">{availableDates.length === 0 ? "Nu exista program disponibil" : "Alege mai intai data"}</option> : null}
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span><HeartPulse size={18} /> Serviciu</span>
          <select disabled={services.length === 0} name="service" required defaultValue="">
            <option value="">
              {services.length === 0 ? "Nu exista servicii disponibile" : "Alege serviciul"}
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.name}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span><UserRound size={18} /> Nume parinte</span>
          <input name="parentName" type="text" placeholder="Nume si prenume" required />
        </label>

        <label>
          <span><UserRound size={18} /> Nume copil</span>
          <input name="childName" type="text" placeholder="Nume copil" required />
        </label>

        <label>
          <span><UserRound size={18} /> Varsta copilului</span>
          <input name="childAge" type="text" placeholder="Ex: 4 ani, 8 luni" required />
        </label>

        <label>
          <span><Phone size={18} /> Telefon</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            minLength={10}
            maxLength={10}
            placeholder="07xxxxxxxx"
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
            title="Introdu un numar de telefon valid, format din 10 cifre."
            required
          />
        </label>

        <label>
          <span><Mail size={18} /> Email</span>
          <input name="email" type="email" placeholder="email@exemplu.ro" />
        </label>
      </div>

      <label className={styles.fullLabel}>
        <span>Motivul prezentarii</span>
        <textarea name="notes" rows={4} placeholder="Descrie pe scurt motivul consultului sau alte informatii importante" />
      </label>

      <div className={styles.noticeBox}>
        <Info size={20} />
        <p>{appointmentNotice}</p>
      </div>

        <SubmitButton disabled={services.length === 0 || availableDates.length === 0} />

      {formState.status === "error" ? (
        <div className={styles.errorBox} role="status">
          <CheckCircle2 size={20} />
          {formState.message}
        </div>
      ) : null}

      </form>

      {isSuccessModalOpen ? (
        <div className={styles.bookingModalOverlay} role="presentation">
          <div className={styles.bookingModal} role="dialog" aria-modal="true" aria-labelledby="booking-confirmation-title">
            <button
              aria-label="Inchide confirmarea"
              className={styles.bookingModalClose}
              onClick={() => setIsSuccessModalOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
            <div className={styles.bookingModalIcon}>
              <CheckCircle2 size={32} />
            </div>
            <h2 id="booking-confirmation-title">Cererea a fost trimisa</h2>
            <p>Cererea de programare a fost trimisa. Vei primi confirmarea cu detaliile programarii pe email.</p>
            <button className={styles.primaryButton} onClick={() => setIsSuccessModalOpen(false)} type="button">
              Am inteles
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
