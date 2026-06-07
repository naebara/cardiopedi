import { Badge } from "@mantine/core";
import styles from "../programari.module.css";

export type Appointment = {
  id: string;
  date: string;
  day: string;
  time: string;
  durationMin: number;
  childName: string;
  childAge: string | null;
  parentName: string;
  service: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: string;
};

interface AdminAppointmentsListProps {
  appointments: Appointment[];
  onSelect?: (appointment: Appointment) => void;
}

const statusColor: Record<string, string> = {
  Cancelata: "red",
  Confirmata: "green",
  Finalizata: "blue",
  Noua: "yellow",
};

export function AdminAppointmentsList({ appointments, onSelect }: AdminAppointmentsListProps) {
  return (
    <div className={styles.listWrap}>
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
          {appointments.map((appointment) => (
            <tr
              key={appointment.id}
              className={styles.row}
              onClick={() => onSelect?.(appointment)}
            >
              <td>{appointment.day}, {appointment.date}</td>
              <td>{appointment.time}</td>
              <td>
                <div className={styles.rowChild}>{appointment.childName}</div>
                <div className={styles.rowSub}>{appointment.childAge || "-"} · {appointment.parentName}</div>
              </td>
              <td>{appointment.service}</td>
              <td>{appointment.phone}</td>
              <td>
                <Badge color={statusColor[appointment.status] ?? "gray"} variant="light" radius="sm">
                  {appointment.status}
                </Badge>
              </td>
            </tr>
          ))}
          {appointments.length === 0 && (
            <tr>
              <td colSpan={6} className={styles.emptyList}>
                Nu există programări pentru perioada selectată.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
