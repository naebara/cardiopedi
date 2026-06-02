import { requireFeature } from "@/lib/admin-features";
import { services } from "@/app/site-data";
import styles from "../../admin.module.css";

export default async function AdminServicesSettingsPage() {
  await requireFeature("services.manage");

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Servicii & tarife</h1>
          <p>Serviciile afisate pe site si preturile comunicate pacientilor.</p>
        </div>
      </header>

      <section className={styles.grid}>
        {services.map((service) => (
          <article className={styles.card} key={service.name}>
            <span className={styles.featurePill}>{service.price}</span>
            <h2>{service.name}</h2>
            <p className={styles.muted}>{service.description}</p>
          </article>
        ))}
      </section>
    </>
  );
}
