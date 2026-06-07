"use client";

import { useActionState, useState } from "react";
import { createAdminUser, type CreateAdminUserState } from "@/app/admin/actions";
import type { AdminFeatureKey } from "@/lib/admin-features";
import styles from "../admin.module.css";

type FeatureOption = {
  key: AdminFeatureKey;
  name: string;
  description: string;
};

const initialState: CreateAdminUserState = {
  message: "",
  status: "idle",
};

export function CreateUserForm({ features }: { features: readonly FeatureOption[] }) {
  const [state, formAction, isPending] = useActionState(createAdminUser, initialState);
  const [isMasterUser, setIsMasterUser] = useState(false);

  return (
    <form action={formAction} className={`${styles.card} ${styles.createUserCard}`}>
      <div>
        <h2>Utilizator nou</h2>
        <p className={styles.muted}>Creeaza cont cu email si parola. Login-ul public ramane inchis.</p>
      </div>

      <div className={styles.userFormGrid}>
        <label>
          <span>Nume</span>
          <input autoComplete="name" name="name" placeholder="Nume complet" type="text" />
        </label>
        <label>
          <span>Email</span>
          <input autoComplete="email" name="email" placeholder="email@cardiopedi.ro" required type="email" />
        </label>
        <label>
          <span>Parola</span>
          <input autoComplete="new-password" minLength={6} name="password" required type="password" />
        </label>
      </div>

      <label className={styles.masterToggle}>
        <input
          checked={isMasterUser}
          name="isMasterUser"
          onChange={(event) => setIsMasterUser(event.target.checked)}
          type="checkbox"
        />
        Master user
      </label>

      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <label className={styles.featureCheck} key={feature.key}>
            <input disabled={isMasterUser} name="features" type="checkbox" value={feature.key} />
            <span>
              <strong>{feature.name}</strong>
              {feature.description}
            </span>
          </label>
        ))}
      </div>

      {state.message ? (
        <p className={state.status === "success" ? styles.successText : styles.errorText} aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <button className={styles.saveButton} disabled={isPending} type="submit">
        Creeaza utilizator
      </button>
    </form>
  );
}
