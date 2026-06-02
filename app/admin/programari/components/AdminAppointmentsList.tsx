import styles from "../../admin.module.css";

export type Appointment = {
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

interface AdminAppointmentsListProps {
  appointments: Appointment[];
}

export function AdminAppointmentsList({ appointments }: AdminAppointmentsListProps) {
  return (
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
          <tr key={appointment.id}>
            <td>{appointment.day}, {appointment.date}</td>
            <td>{appointment.time}</td>
            <td>{appointment.childName}<br /><small>{appointment.parentName}</small></td>
            <td>{appointment.service}</td>
            <td>{appointment.phone}</td>
            <td><span className={styles.status}>{appointment.status}</span></td>
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
  );
}
