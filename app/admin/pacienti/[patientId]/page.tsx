import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Baby, CalendarDays, Mail, Phone, UserRound } from "lucide-react";
import { canAccess, requireFeature } from "@/lib/admin-features";
import { getAdminPatientDetails } from "@/lib/appointments";
import { DeletePatientButton } from "../DeletePatientButton";
import { PatientHistoryTable } from "./PatientHistoryTable";
import styles from "../../admin.module.css";

export default async function AdminPatientDetailsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const currentUser = await requireFeature("patients.view");
  const { patientId } = await params;
  const patient = await getAdminPatientDetails(patientId);

  if (!patient) {
    notFound();
  }

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <Link className={styles.backLink} href="/admin/pacienti">
            <ArrowLeft size={17} />
            Inapoi la pacienti
          </Link>
          <h1>{patient.childName}</h1>
          <p>Detalii generale si istoricul programarilor pentru pacient.</p>
        </div>
        {canAccess(currentUser, "patients.manage") ? (
          <DeletePatientButton patientId={patientId} patientName={patient.childName} />
        ) : null}
      </header>

      <section className={styles.patientDetailGrid}>
        <article className={styles.card}>
          <h2>Detalii generale</h2>
          <div className={styles.detailList}>
            <div>
              <Baby size={18} />
              <span>Varsta</span>
              <strong>{patient.childAges.join(", ") || "-"}</strong>
            </div>
            <div>
              <UserRound size={18} />
              <span>Parinti / apartinatori</span>
              <strong>{patient.parentNames.join(", ") || "-"}</strong>
            </div>
            <div>
              <Phone size={18} />
              <span>Telefon</span>
              <strong>{patient.phones.join(", ") || "-"}</strong>
            </div>
            <div>
              <Mail size={18} />
              <span>Email</span>
              <strong>{patient.emails.join(", ") || "-"}</strong>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>Programari totale</span>
              <strong>{patient.appointments.length}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.panel} style={{ marginTop: 16 }}>
        <h2>Istoric programari</h2>
        <PatientHistoryTable appointments={patient.appointments} />
      </section>
    </>
  );
}
