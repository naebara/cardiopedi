"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, HeartPulse, Info, Mail, Phone, UserRound } from "lucide-react";
import { appointmentNotice, services } from "../site-data";
import styles from "../public-site.module.css";

const daySchedule: Record<number, { start: string; end: string }> = {
  1: { start: "15:00", end: "20:00" },
  3: { start: "08:00", end: "14:30" },
  4: { start: "15:00", end: "20:00" },
  5: { start: "15:00", end: "20:00" },
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function labelDate(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function buildSlots(start: string, end: string) {
  const slots = [];
  const close = toMinutes(end);
  for (let time = toMinutes(start); time + 30 <= close; time += 30) {
    slots.push(toTime(time));
  }
  return slots;
}

export function BookingForm() {
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();

    for (let offset = 0; offset < 35 && dates.length < 14; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      if (daySchedule[date.getDay()]) {
        dates.push({
          value: dateValue(date),
          label: labelDate(date),
          weekday: date.getDay(),
        });
      }
    }

    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(availableDates[0]?.value ?? "");
  const selectedDateMeta = availableDates.find((date) => date.value === selectedDate);
  const slots = selectedDateMeta ? buildSlots(daySchedule[selectedDateMeta.weekday].start, daySchedule[selectedDateMeta.weekday].end) : [];
  const [selectedTime, setSelectedTime] = useState(slots[0] ?? "");
  const [sent, setSent] = useState(false);

  function onDateChange(value: string) {
    setSelectedDate(value);
    const meta = availableDates.find((date) => date.value === value);
    const nextSlots = meta ? buildSlots(daySchedule[meta.weekday].start, daySchedule[meta.weekday].end) : [];
    setSelectedTime(nextSlots[0] ?? "");
  }

  return (
    <form
      className={styles.bookingForm}
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <div className={styles.formGrid}>
        <label>
          <span><CalendarDays size={18} /> Data</span>
          <select value={selectedDate} onChange={(event) => onDateChange(event.target.value)} required>
            {availableDates.map((date) => (
              <option key={date.value} value={date.value}>
                {date.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span><Clock size={18} /> Ora</span>
          <select value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} required>
            {slots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span><HeartPulse size={18} /> Serviciu</span>
          <select required defaultValue={services[0].name}>
            {services.map((service) => (
              <option key={service.name} value={service.name}>
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
          <span><Phone size={18} /> Telefon</span>
          <input name="phone" type="tel" placeholder="07xx xxx xxx" required />
        </label>

        <label>
          <span><Mail size={18} /> Email</span>
          <input name="email" type="email" placeholder="email@exemplu.ro" />
        </label>
      </div>

      <label className={styles.fullLabel}>
        <span>Detalii utile</span>
        <textarea name="notes" rows={4} placeholder="Varsta copilului, motivul consultului sau alte informatii importante" />
      </label>

      <div className={styles.noticeBox}>
        <Info size={20} />
        <p>{appointmentNotice}</p>
      </div>

      <button className={styles.primaryButton} type="submit">
        Trimite cererea de programare
      </button>

      {sent ? (
        <div className={styles.successBox} role="status">
          <CheckCircle2 size={20} />
          Cererea a fost pregatita. Urmatorul pas este conectarea formularului la confirmari prin email, telefon sau WhatsApp.
        </div>
      ) : null}
    </form>
  );
}
