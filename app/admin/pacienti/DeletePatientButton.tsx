"use client";

import { MouseEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { softDeletePatient } from "@/app/admin/actions";
import styles from "../admin.module.css";

type DeletePatientButtonProps = {
  compact?: boolean;
  patientId: string;
  patientName: string;
};

export function DeletePatientButton({ compact = false, patientId, patientName }: DeletePatientButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function openModal(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setMessage("");
    setIsOpen(true);
  }

  function closeModal() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
    setMessage("");
  }

  function confirmDelete() {
    startTransition(async () => {
      const result = await softDeletePatient(patientId);

      if (result.status === "success") {
        setIsOpen(false);
        router.push("/admin/pacienti");
        router.refresh();
        return;
      }

      setMessage(result.message);
    });
  }

  return (
    <>
      <button
        aria-label={`Sterge pacientul ${patientName}`}
        className={compact ? `${styles.iconButton} ${styles.iconButtonDanger}` : styles.dangerButton}
        onClick={openModal}
        onKeyDown={(event) => event.stopPropagation()}
        type="button"
      >
        <Trash2 size={compact ? 17 : 18} />
        {compact ? null : "Sterge pacientul"}
      </button>

      {isOpen ? (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Sterge pacientul?</h2>
                <p>
                  Pacientul {patientName} si programarile lui nu vor mai aparea in UI.
                  Datele raman salvate in baza de date.
                </p>
              </div>
              <button aria-label="Inchide" className={styles.iconButton} onClick={closeModal} type="button">
                <X size={18} />
              </button>
            </div>

            {message ? <p className={styles.errorText}>{message}</p> : null}

            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} disabled={isPending} onClick={closeModal} type="button">
                Renunta
              </button>
              <button className={styles.dangerButton} disabled={isPending} onClick={confirmDelete} type="button">
                {isPending ? "Se sterge..." : "Sterge pacientul"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
