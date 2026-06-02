import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { ParallaxServicesHero } from "../components/ParallaxServicesHero";
import { ServicesSection } from "../components/Sections";
import styles from "../public-site.module.css";

export default function ServicesPage() {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <ParallaxServicesHero />
      <ServicesSection />
      <PublicFooter />
    </main>
  );
}
