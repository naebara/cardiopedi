"use client";

import { useState } from "react";
import { Modal, Text } from "@mantine/core";
import { Baby, CalendarDays, Clock, Phone, UserRound } from "lucide-react";
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

export function PatientHistoryTable({ appointment }: { appointment: AdminPatientAppointment }) {
  const [selected, setSelected] = useState<AdminPatientAppointment | null>(null);

  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Ora</th>
            <th>Varsta</th>
            <th>Parinte</th>
            <th>Telefon</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            className={styles.clickableRow}
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
              <span className={styles.historyCellIcon}><Baby size={14} /> {appointment.childAge || "-"}</span>
            </td>
            <td>
              <span className={styles.historyCellIcon}><UserRound size={14} /> {appointment.parentName}</span>
            </td>
            <td>
              <span className={styles.historyCellIcon}><Phone size={14} /> {appointment.phone}</span>
            </td>
            <td><span className={statusClassName(appointment.status)}>{appointment.status}</span></td>
          </tr>
        </tbody>
      </table>

      <Modal
        centered
        onClose={() => setSelected(null)}
        opened={Boolean(selected)}
        radius="lg"
        size="md"
        title={selected ? `Motivul prezentarii - ${selected.date} ${selected.time}` : "Motivul prezentarii"}
      >
        <Text size="sm">
          {selected?.notes || "Nu exista un motiv al prezentarii pentru aceasta programare."}
        </Text>
      </Modal>
    </>
  );
}
