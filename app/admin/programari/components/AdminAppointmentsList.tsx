import { Badge } from "@mantine/core";
import styles from "../../admin.module.css";

export type Appointment = {
  id: string;
  date: string;
  day: string;
  time: string;
  durationMin: number;
  childName: string;
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
    <div style={{ flex: 1, overflowY: "auto" }}>
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
              onClick={() => onSelect?.(appointment)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              <td>{appointment.day}, {appointment.date}</td>
              <td>{appointment.time}</td>
              <td>{appointment.childName}<br /><small>{appointment.parentName}</small></td>
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
              <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--mantine-color-gray-6)" }}>
                Nu există programări pentru perioada selectată.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
