import Link from "next/link";
import { CalendarDays, Clock, HeartPulse, UsersRound } from "lucide-react";
import { canAccess, requireFeature } from "@/lib/admin-features";
import styles from "./admin.module.css";

export default async function AdminDashboardPage() {
  const user = await requireFeature("admin.dashboard.view");

  const cards = [
    { label: "Programari azi", value: "6", icon: CalendarDays },
    { label: "Saptamana aceasta", value: "24", icon: Clock },
    { label: "Pacienti in evidenta", value: "18", icon: UsersRound },
    { label: "Servicii active", value: "4", icon: HeartPulse },
  ];

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Dashboard</h1>
          <p>Rezumat rapid pentru programari, pacienti si setarile cabinetului.</p>
        </div>
        {user.isMasterUser ? <span className={styles.badge}>Acces complet</span> : null}
      </header>

      <section className={styles.statsGrid}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className={styles.card} key={card.label}>
              <Icon size={22} color="#2f9f7f" />
              <span className={styles.metric}>{card.value}</span>
              <p className={styles.muted}>{card.label}</p>
            </article>
          );
        })}
      </section>

      <section className={styles.grid} style={{ marginTop: 16 }}>
        {canAccess(user, "appointments.view") ? (
          <article className={styles.card}>
            <h2>Programari</h2>
            <p className={styles.muted}>Calendar si lista, cu filtre pentru azi, saptamana si luna.</p>
            <Link className={styles.button} href="/admin/programari">Deschide programarile</Link>
          </article>
        ) : null}

        {canAccess(user, "users.manage") ? (
          <article className={styles.card}>
            <h2>Feature access</h2>
            <p className={styles.muted}>Acorda acces punctual altor utilizatori sau seteaza master user.</p>
            <Link className={styles.button} href="/admin/users">Gestioneaza utilizatorii</Link>
          </article>
        ) : null}
      </section>
    </>
  );
}
