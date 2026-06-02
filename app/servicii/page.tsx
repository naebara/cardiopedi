import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { ParallaxServicesHero } from "../components/ParallaxServicesHero";
import { ServicesSection } from "../components/Sections";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { getPublicServices } from "@/lib/services";
import styles from "../public-site.module.css";

export default async function ServicesPage() {
  const [services, schedule] = await Promise.all([getPublicServices(), getPublicScheduleSlots()]);

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <ParallaxServicesHero />
      <ServicesSection services={services} />
      <PublicFooter schedule={schedule} />
    </main>
  );
}
