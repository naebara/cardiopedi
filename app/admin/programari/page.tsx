import { requireFeature } from "@/lib/admin-features";
import styles from "../admin.module.css";
import { AppointmentsPanel } from "./AppointmentsPanel";

export default async function AdminAppointmentsPage() {
  await requireFeature("appointments.view");

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Programari</h1>
          <p>Calendar si lista pentru programarile pacientilor, filtrate pe azi, saptamana sau luna.</p>
        </div>
      </header>

      <AppointmentsPanel />
    </>
  );
}
