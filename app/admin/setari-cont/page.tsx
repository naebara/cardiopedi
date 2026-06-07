import { KeyRound } from "lucide-react";
import { getCurrentAdminUser } from "@/lib/admin-features";
import { AccountSettingsForm } from "./AccountSettingsForm";
import styles from "../admin.module.css";

export default async function AccountSettingsPage() {
  const user = await getCurrentAdminUser();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Setari cont</h1>
          <p>Gestioneaza parola contului cu care intri in admin.</p>
        </div>
        <span className={styles.badge}><KeyRound size={16} /> {user.email}</span>
      </header>

      <section className={styles.panel}>
        <div className={styles.sectionTitle}>
          <div>
            <h2>Resetare parola</h2>
            <p className={styles.muted}>Introdu parola curenta si alege o parola noua.</p>
          </div>
        </div>
        <AccountSettingsForm />
      </section>
    </>
  );
}
