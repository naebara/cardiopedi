import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Baby, CalendarDays, Mail, Phone, UserRound } from "lucide-react";
import { canAccess, requireFeature } from "@/lib/admin-features";
import { enqueueAuditEvent } from "@/lib/audit";
import { getAdminPatientDetails } from "@/lib/appointments";
import { DeletePatientRecordButton } from "../DeletePatientRecordButton";
import { PatientHistoryTable } from "./PatientHistoryTable";
import styles from "../../admin.module.css";

export default async function AdminPatientDetailsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const currentUser = await requireFeature("patients.view");
  const { patientId } = await params;
  const appointment = await getAdminPatientDetails(patientId);

  if (!appointment) {
    notFound();
  }

  enqueueAuditEvent({
    action: "PATIENT_RECORD_VIEWED",
    actor: currentUser,
    category: "PATIENTS",
    entityId: appointment.id,
    entityType: "Appointment",
    summary: `Fisa individuala a fost accesata (${appointment.id})`,
  });

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <Link className={styles.backLink} href="/admin/pacienti">
            <ArrowLeft size={17} />
            Inapoi la pacienti
          </Link>
          <h1>{appointment.childName}</h1>
          <p>Fisa individuala asociata programarii selectate.</p>
        </div>
        {canAccess(currentUser, "patients.manage") ? (
          <DeletePatientRecordButton appointmentId={appointment.id} patientName={appointment.childName} />
        ) : null}
      </header>

      <section className={styles.patientDetailGrid}>
        <article className={styles.card}>
          <h2>Detalii generale</h2>
          <div className={styles.detailList}>
            <div>
              <Baby size={18} />
              <span>Varsta</span>
              <strong>{appointment.childAge || "-"}</strong>
            </div>
            <div>
              <UserRound size={18} />
              <span>Parinte / apartinator</span>
              <strong>{appointment.parentName || "-"}</strong>
            </div>
            <div>
              <Phone size={18} />
              <span>Telefon</span>
              <strong>{appointment.phone || "-"}</strong>
            </div>
            <div>
              <Mail size={18} />
              <span>Email</span>
              <strong>{appointment.email || "-"}</strong>
            </div>
            <div>
              <CalendarDays size={18} />
              <span>Programare</span>
              <strong>{appointment.day}, {appointment.date} · {appointment.time}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.panel} style={{ marginTop: 16 }}>
        <h2>Programare</h2>
        <PatientHistoryTable appointment={appointment} />
      </section>
    </>
  );
}
