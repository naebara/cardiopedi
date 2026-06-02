"use client";

import { useMemo, useState } from "react";
import styles from "../admin.module.css";

type Appointment = {
  id: string;
  date: string;
  day: string;
  time: string;
  childName: string;
  parentName: string;
  service: string;
  phone: string;
  status: string;
};

const appointments: Appointment[] = [
  {
    id: "apt-1",
    date: "2026-06-03",
    day: "Miercuri",
    time: "08:30",
    childName: "Maria Ionescu",
    parentName: "Ana Ionescu",
    service: "Pachet consult + eco + EKG",
    phone: "0712345678",
    status: "Confirmata",
  },
  {
    id: "apt-2",
    date: "2026-06-03",
    day: "Miercuri",
    time: "10:00",
    childName: "Andrei Pop",
    parentName: "Mihai Pop",
    service: "Control",
    phone: "0723456789",
    status: "Noua",
  },
  {
    id: "apt-3",
    date: "2026-06-04",
    day: "Joi",
    time: "16:30",
    childName: "Sofia Stan",
    parentName: "Elena Stan",
    service: "EKG",
    phone: "0734567890",
    status: "Confirmata",
  },
  {
    id: "apt-4",
    date: "2026-06-05",
    day: "Vineri",
    time: "18:00",
    childName: "Vlad Marin",
    parentName: "Ioana Marin",
    service: "Monitorizare EKG / TA 24h",
    phone: "0745678901",
    status: "Noua",
  },
];

const filters = [
  { key: "today", label: "Azi" },
  { key: "week", label: "Saptamana aceasta" },
  { key: "month", label: "Luna aceasta" },
] as const;

export function AppointmentsPanel() {
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [range, setRange] = useState<(typeof filters)[number]["key"]>("week");

  const visibleAppointments = useMemo(() => {
    if (range === "today") {
      return appointments.filter((appointment) => appointment.date === "2026-06-03");
    }

    return appointments;
  }, [range]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<string, Appointment[]>();

    for (const appointment of visibleAppointments) {
      const key = `${appointment.day}, ${appointment.date.slice(8)}`;
      groups.set(key, [...(groups.get(key) ?? []), appointment]);
    }

    return Array.from(groups.entries());
  }, [visibleAppointments]);

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <button data-active={view === "calendar"} onClick={() => setView("calendar")} type="button">Calendar view</button>
        <button data-active={view === "list"} onClick={() => setView("list")} type="button">List view</button>
        {filters.map((filter) => (
          <button data-active={range === filter.key} key={filter.key} onClick={() => setRange(filter.key)} type="button">
            {filter.label}
          </button>
        ))}
      </div>

      {view === "calendar" ? (
        <div className={styles.calendarGrid}>
          {groupedByDay.map(([day, dayAppointments]) => (
            <section className={styles.calendarDay} key={day}>
              <strong>{day}</strong>
              {dayAppointments.map((appointment) => (
                <article className={styles.appointmentCard} key={appointment.id}>
                  <b>{appointment.time} - {appointment.childName}</b>
                  <span className={styles.appointmentMeta}>{appointment.service}</span>
                  <span className={styles.appointmentMeta}>{appointment.parentName} · {appointment.phone}</span>
                </article>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ora</th>
              <th>Copil</th>
              <th>Serviciu</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleAppointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.day}, {appointment.date}</td>
                <td>{appointment.time}</td>
                <td>{appointment.childName}<br /><small>{appointment.parentName}</small></td>
                <td>{appointment.service}</td>
                <td>{appointment.phone}</td>
                <td><span className={styles.status}>{appointment.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
