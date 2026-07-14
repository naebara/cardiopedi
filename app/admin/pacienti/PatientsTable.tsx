"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { AdminPatient } from "@/lib/appointments";
import { DeletePatientRecordButton } from "./DeletePatientRecordButton";
import styles from "../admin.module.css";

function matchesSearch(patient: AdminPatient, search: string) {
  const query = search.trim().toLocaleLowerCase("ro-RO");

  if (!query) {
    return true;
  }

  return [
    patient.childName,
    patient.childAge ?? "",
    patient.parentName,
    patient.phone,
    patient.date,
    patient.time,
  ].some((value) => value.toLocaleLowerCase("ro-RO").includes(query));
}

export function PatientsTable({
  canManagePatients,
  patients,
}: {
  canManagePatients: boolean;
  patients: AdminPatient[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => matchesSearch(patient, search));
  }, [patients, search]);

  function openPatient(appointmentId: string) {
    router.push(`/admin/pacienti/${appointmentId}`);
  }

  return (
    <section className={styles.panel}>
      <div className={styles.tableToolbar}>
        <label className={styles.searchField}>
          <Search size={18} />
          <input
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Cauta dupa copil, parinte sau telefon"
            type="search"
            value={search}
          />
        </label>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Copil</th>
            <th>Data</th>
            <th>Ora</th>
            <th>Varsta</th>
            <th>Parinte / apartinator</th>
            <th>Telefon</th>
            {canManagePatients ? <th>Actiuni</th> : null}
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((patient) => (
            <tr
              className={styles.clickableRow}
              key={patient.appointmentId}
              onClick={() => openPatient(patient.appointmentId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPatient(patient.appointmentId);
                }
              }}
              role="link"
              tabIndex={0}
            >
              <td><strong>{patient.childName}</strong></td>
              <td>{patient.day}, {patient.date}</td>
              <td>{patient.time}</td>
              <td>{patient.childAge || "-"}</td>
              <td>{patient.parentName || "-"}</td>
              <td>{patient.phone || "-"}</td>
              {canManagePatients ? (
                <td>
                  <div className={styles.tableActions}>
                    <DeletePatientRecordButton compact appointmentId={patient.appointmentId} patientName={patient.childName} />
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
          {filteredPatients.length === 0 ? (
            <tr>
              <td colSpan={canManagePatients ? 7 : 6}>Nu exista fise pentru cautarea curenta.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
