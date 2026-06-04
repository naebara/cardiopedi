import { AboutSection, Hero, ServicesSection, TrustBar } from "./components/Sections";
import { PublicFooter, PublicHeader } from "./components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { getPublicServices } from "@/lib/services";
import styles from "./public-site.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [services, schedule] = await Promise.all([getPublicServices(), getPublicScheduleSlots()]);

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <Hero />
      <TrustBar />
      <ServicesSection compact services={services} />
      <AboutSection />
      <PublicFooter schedule={schedule} />
    </main>
  );
}
