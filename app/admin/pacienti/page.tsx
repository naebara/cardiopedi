import { canAccess, requireFeature } from "@/lib/admin-features";
import { getAdminPatients } from "@/lib/appointments";
import { PatientsTable } from "./PatientsTable";
import styles from "../admin.module.css";

export default async function AdminPatientsPage() {
  const currentUser = await requireFeature("patients.view");
  const patients = await getAdminPatients();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Pacienti</h1>
          <p>Fiecare rand reprezinta o singura programare noua sau confirmata.</p>
        </div>
        <span className={styles.badge}>
          {patients.length} {patients.length === 1 ? "pacient" : "pacienti"}
        </span>
      </header>

      <PatientsTable canManagePatients={canAccess(currentUser, "patients.manage")} patients={patients} />
    </>
  );
}
