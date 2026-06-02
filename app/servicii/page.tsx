import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { ServicesSection } from "../components/Sections";
import styles from "../public-site.module.css";

export default function ServicesPage() {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.pageHero}>
        <p className={styles.eyebrow}>Servicii</p>
        <h1>Tarife transparente pentru evaluari cardiologice pediatrice.</h1>
        <p>Aici sunt serviciile initiale comunicate pentru Cardiopedi.</p>
      </section>
      <ServicesSection />
      <PublicFooter />
    </main>
  );
}
