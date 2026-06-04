import { requireFeature } from "@/lib/admin-features";
import { getAdminPatients } from "@/lib/appointments";
import { PatientsTable } from "./PatientsTable";
import styles from "../admin.module.css";

export default async function AdminPatientsPage() {
  await requireFeature("patients.view");
  const patients = await getAdminPatients();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Pacienti</h1>
          <p>Lista cu pacientii care au programari noi sau confirmate.</p>
        </div>
      </header>

      <PatientsTable patients={patients} />
    </>
  );
}
