"use client";

import { useState } from "react";
import { Modal, Text } from "@mantine/core";
import { CalendarDays, Clock, HeartPulse, Phone, UserRound } from "lucide-react";
import type { AdminPatientAppointment } from "@/lib/appointments";
import styles from "../../admin.module.css";

function statusClassName(status: string) {
  if (status === "Noua") {
    return `${styles.appointmentStatusBadge} ${styles.appointmentStatusNew}`;
  }

  if (status === "Confirmata") {
    return `${styles.appointmentStatusBadge} ${styles.appointmentStatusConfirmed}`;
  }

  if (status === "Cancelata") {
    return `${styles.appointmentStatusBadge} ${styles.appointmentStatusCancelled}`;
  }

  return styles.appointmentStatusBadge;
}

export function PatientHistoryTable({ appointments }: { appointments: AdminPatientAppointment[] }) {
  const [selected, setSelected] = useState<AdminPatientAppointment | null>(null);

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Ora</th>
            <th>Serviciu</th>
            <th>Parinte</th>
            <th>Telefon</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr
              className={styles.clickableRow}
              key={appointment.id}
              onClick={() => setSelected(appointment)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(appointment);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <td>
                <span className={styles.historyCellIcon}><CalendarDays size={14} /> {appointment.day}, {appointment.date}</span>
              </td>
              <td>
                <span className={styles.historyCellIcon}><Clock size={14} /> {appointment.time}</span>
              </td>
              <td>
                <span className={styles.historyCellIcon}><HeartPulse size={14} /> {appointment.service}</span>
              </td>
              <td>
                <span className={styles.historyCellIcon}><UserRound size={14} /> {appointment.parentName}</span>
              </td>
              <td>
                <span className={styles.historyCellIcon}><Phone size={14} /> {appointment.phone}</span>
              </td>
              <td><span className={statusClassName(appointment.status)}>{appointment.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        centered
        onClose={() => setSelected(null)}
        opened={Boolean(selected)}
        radius="lg"
        size="md"
        title={selected ? `Observatii - ${selected.date} ${selected.time}` : "Observatii"}
      >
        <Text size="sm">
          {selected?.notes || "Nu exista observatii pentru aceasta programare."}
        </Text>
      </Modal>
    </>
  );
}
