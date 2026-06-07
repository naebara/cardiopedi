"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Plus, ShieldCheck, X } from "lucide-react";
import { createAdminUser, updateUserAccess, type CreateAdminUserState } from "@/app/admin/actions";
import type { AdminFeatureKey } from "@/lib/admin-features";
import styles from "../admin.module.css";

type FeatureOption = {
  key: AdminFeatureKey;
  name: string;
  description: string;
};

type UserAccessRow = {
  id: string;
  name: string | null;
  email: string;
  isMasterUser: boolean;
  features: string[];
};

type ActiveModal =
  | { type: "create" }
  | { type: "edit"; user: UserAccessRow }
  | null;

const initialCreateState: CreateAdminUserState = {
  message: "",
  status: "idle",
};

function featureSummary(user: UserAccessRow, features: readonly FeatureOption[]) {
  if (user.isMasterUser) {
    return "Toate permisiunile";
  }

  const granted = features.filter((feature) => user.features.includes(feature.key));
  if (granted.length === 0) {
    return "Fara acces configurat";
  }

  return granted.map((feature) => feature.name).join(", ");
}

function CreateUserForm({ features }: { features: readonly FeatureOption[] }) {
  const [state, formAction, isPending] = useActionState(createAdminUser, initialCreateState);
  const [isMasterUser, setIsMasterUser] = useState(false);

  return (
    <form action={formAction} className={styles.modalFormStack}>
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

function EditAccessForm({
  currentUserId,
  features,
  onSaved,
  user,
}: {
  currentUserId: string;
  features: readonly FeatureOption[];
  onSaved: (user: UserAccessRow) => void;
  user: UserAccessRow;
}) {
  const isOwnUser = user.id === currentUserId;
  const [isMasterUser, setIsMasterUser] = useState(user.isMasterUser);
  const [selectedFeatures, setSelectedFeatures] = useState(user.features);
  const [isPending, startTransition] = useTransition();

  function setFeature(featureKey: AdminFeatureKey, checked: boolean) {
    setSelectedFeatures((current) => {
      if (checked) {
        return current.includes(featureKey) ? current : [...current, featureKey];
      }

      return current.filter((key) => key !== featureKey);
    });
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateUserAccess(formData);
      onSaved({
        ...user,
        features: isMasterUser ? [] : selectedFeatures,
        isMasterUser: isOwnUser ? true : isMasterUser,
      });
    });
  }

  return (
    <form action={handleSubmit} className={styles.modalFormStack}>
      <input name="userId" type="hidden" value={user.id} />

      <label className={styles.masterToggle}>
        <input
          checked={isMasterUser}
          disabled={isOwnUser}
          name="isMasterUser"
          onChange={(event) => setIsMasterUser(event.target.checked)}
          type="checkbox"
        />
        Master user
      </label>

      <div className={styles.featureGrid}>
        {features.map((feature) => (
          <label className={styles.featureCheck} key={feature.key}>
            <input
              checked={isMasterUser || selectedFeatures.includes(feature.key)}
              disabled={isMasterUser}
              name="features"
              onChange={(event) => setFeature(feature.key, event.target.checked)}
              type="checkbox"
              value={feature.key}
            />
            <span>
              <strong>{feature.name}</strong>
              {feature.description}
            </span>
          </label>
        ))}
      </div>

      <button className={styles.saveButton} disabled={isPending} type="submit">
        Salveaza accesul
      </button>
    </form>
  );
}

export function UsersManager({
  currentUserId,
  features,
  users,
}: {
  currentUserId: string;
  features: readonly FeatureOption[];
  users: UserAccessRow[];
}) {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [visibleUsers, setVisibleUsers] = useState(users);

  useEffect(() => {
    setVisibleUsers(users);
  }, [users]);

  function handleUserSaved(updatedUser: UserAccessRow) {
    setVisibleUsers((current) => current.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setActiveModal(null);
  }

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.usersToolbar}>
          <div>
            <h2>Conturi admin</h2>
            <p className={styles.muted}>{visibleUsers.length} utilizatori configurati</p>
          </div>
          <button className={styles.button} onClick={() => setActiveModal({ type: "create" })} type="button">
            <Plus size={18} />
            Adauga utilizator
          </button>
        </div>

        <div className={styles.responsiveTableWrap}>
          <table className={`${styles.table} ${styles.usersTable}`}>
            <thead>
              <tr>
                <th>Utilizator</th>
                <th>Rol</th>
                <th>Acces</th>
                <th>Actiuni</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Utilizator">
                    <strong>{user.name || user.email}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td data-label="Rol">
                    <span className={user.isMasterUser ? styles.statusLive : styles.status}>
                      {user.isMasterUser ? (
                        <>
                          <ShieldCheck size={14} /> Master
                        </>
                      ) : (
                        "Utilizator"
                      )}
                    </span>
                  </td>
                  <td data-label="Acces">
                    <span className={styles.userAccessSummary}>{featureSummary(user, features)}</span>
                  </td>
                  <td data-label="Actiuni">
                    <button
                      aria-label={`Editeaza accesul pentru ${user.name || user.email}`}
                      className={styles.iconButton}
                      onClick={() => setActiveModal({ type: "edit", user })}
                      type="button"
                    >
                      <Pencil size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {activeModal ? (
        <div className={styles.modalBackdrop}>
          <div aria-labelledby="users-modal-title" aria-modal="true" className={styles.modalPanel} role="dialog">
            <div className={styles.modalHeader}>
              <div>
                <h2 id="users-modal-title">
                  {activeModal.type === "create" ? "Adauga utilizator" : `Acces pentru ${activeModal.user.name || activeModal.user.email}`}
                </h2>
                <p className={styles.muted}>
                  {activeModal.type === "create"
                    ? "Contul va putea intra doar prin pagina de login."
                    : activeModal.user.email}
                </p>
              </div>
              <button aria-label="Inchide" className={styles.iconButton} onClick={() => setActiveModal(null)} type="button">
                <X size={18} />
              </button>
            </div>

            {activeModal.type === "create" ? (
              <CreateUserForm features={features} />
            ) : (
              <EditAccessForm
                currentUserId={currentUserId}
                features={features}
                onSaved={handleUserSaved}
                user={activeModal.user}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
