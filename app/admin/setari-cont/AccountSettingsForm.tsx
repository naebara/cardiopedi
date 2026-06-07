"use client";

import { useActionState } from "react";
import { updateOwnPassword, type AccountPasswordState } from "@/app/admin/actions";
import styles from "../admin.module.css";

const initialState: AccountPasswordState = {
  message: "",
  status: "idle",
};

export function AccountSettingsForm() {
  const [state, formAction, isPending] = useActionState(updateOwnPassword, initialState);

  return (
    <form action={formAction} className={styles.serviceForm}>
      <label>
        <span>Parola curenta</span>
        <input autoComplete="current-password" name="currentPassword" required type="password" />
      </label>

      <label>
        <span>Parola noua</span>
        <input autoComplete="new-password" minLength={6} name="newPassword" required type="password" />
      </label>

      <label>
        <span>Confirma parola noua</span>
        <input autoComplete="new-password" minLength={6} name="confirmPassword" required type="password" />
      </label>

      {state.message ? (
        <p className={state.status === "success" ? styles.successText : styles.errorText} aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <button className={styles.saveButton} disabled={isPending} type="submit">
        Actualizeaza parola
      </button>
    </form>
  );
}
