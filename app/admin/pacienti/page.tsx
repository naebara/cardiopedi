import { requireFeature } from "@/lib/admin-features";
import styles from "../admin.module.css";

const patients = [
  { child: "Maria Ionescu", parent: "Ana Ionescu", phone: "0712345678", lastVisit: "3 Iunie 2026" },
  { child: "Andrei Pop", parent: "Mihai Pop", phone: "0723456789", lastVisit: "3 Iunie 2026" },
  { child: "Sofia Stan", parent: "Elena Stan", phone: "0734567890", lastVisit: "4 Iunie 2026" },
];

export default async function AdminPatientsPage() {
  await requireFeature("patients.view");

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Pacienti</h1>
          <p>Lista rapida cu copii, parinti si istoricul ultimelor programari.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Copil</th>
              <th>Parinte</th>
              <th>Telefon</th>
              <th>Ultima programare</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.child}>
                <td>{patient.child}</td>
                <td>{patient.parent}</td>
                <td>{patient.phone}</td>
                <td>{patient.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
