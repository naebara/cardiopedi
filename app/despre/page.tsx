import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { AboutSection, CarePrinciples } from "../components/Sections";
import styles from "../public-site.module.css";

export default function AboutPage() {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.pageHero}>
        <p className={styles.eyebrow}>Despre</p>
        <h1>Cardiopedi, cardiologie pediatrica intr-un cadru prietenos.</h1>
      </section>
      <AboutSection />
      <CarePrinciples />
      <PublicFooter />
    </main>
  );
}
