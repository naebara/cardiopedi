"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { AdminPatient } from "@/lib/appointments";
import { DeletePatientButton } from "./DeletePatientButton";
import styles from "../admin.module.css";

function matchesSearch(patient: AdminPatient, search: string) {
  const query = search.trim().toLocaleLowerCase("ro-RO");

  if (!query) {
    return true;
  }

  return [
    patient.childName,
    patient.childAge ?? "",
    ...patient.parentNames,
    ...patient.phones,
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

  function openPatient(patientId: string) {
    router.push(`/admin/pacienti/${patientId}`);
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
            <th>Varsta</th>
            <th>Parinti / apartinatori</th>
            <th>Telefon</th>
            {canManagePatients ? <th>Actiuni</th> : null}
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((patient) => (
            <tr
              className={styles.clickableRow}
              key={patient.childName.toLocaleLowerCase("ro-RO")}
              onClick={() => openPatient(patient.patientId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openPatient(patient.patientId);
                }
              }}
              role="link"
              tabIndex={0}
            >
              <td><strong>{patient.childName}</strong></td>
              <td>{patient.childAge || "-"}</td>
              <td>{patient.parentNames.join(", ") || "-"}</td>
              <td>{patient.phones.join(", ") || "-"}</td>
              {canManagePatients ? (
                <td>
                  <div className={styles.tableActions}>
                    <DeletePatientButton compact patientId={patient.patientId} patientName={patient.childName} />
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
          {filteredPatients.length === 0 ? (
            <tr>
              <td colSpan={canManagePatients ? 5 : 4}>Nu exista pacienti pentru cautarea curenta.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
