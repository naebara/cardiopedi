import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { ParallaxServicesHero } from "../components/ParallaxServicesHero";
import { ServicesSection } from "../components/Sections";
import { getPublicServices } from "@/lib/services";
import styles from "../public-site.module.css";

export default async function ServicesPage() {
  const services = await getPublicServices();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <ParallaxServicesHero />
      <ServicesSection services={services} />
      <PublicFooter />
    </main>
  );
}
