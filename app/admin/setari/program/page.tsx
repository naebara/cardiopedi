import { requireFeature } from "@/lib/admin-features";
import { schedule } from "@/app/site-data";
import styles from "../../admin.module.css";

export default async function AdminScheduleSettingsPage() {
  await requireFeature("schedule.manage");

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Program cabinet</h1>
          <p>Zile, ore disponibile si intervalul standard pentru programari.</p>
        </div>
        <span className={styles.badge}>Interval: 30 min</span>
      </header>

      <section className={styles.card}>
        <div className={styles.settingsList}>
          {schedule.map((item) => (
            <div className={styles.settingsRow} key={item.day}>
              <strong>{item.day}</strong>
              <span>{item.interval}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
