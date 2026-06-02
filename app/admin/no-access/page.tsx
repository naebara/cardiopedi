import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { SignOutButton } from "@/app/components/sign-out-button";
import styles from "../admin.module.css";

export default function NoAccessPage() {
  return (
    <div className={styles.card}>
      <span className={styles.badge}><LockKeyhole size={16} /> Acces restrictionat</span>
      <h1>Nu ai acces la aceasta sectiune.</h1>
      <p className={styles.muted}>
        Un master user poate activa feature-ul necesar pentru contul tau din sectiunea Utilizatori.
      </p>
      <Link className={styles.button} href="/admin">
        Inapoi la dashboard
      </Link>
      <div style={{ marginTop: 12 }}>
        <SignOutButton />
      </div>
    </div>
  );
}
