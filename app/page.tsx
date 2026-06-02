import { AboutSection, Hero, ServicesSection, TrustBar } from "./components/Sections";
import { PublicFooter, PublicHeader } from "./components/PublicLayout";
import { getPublicServices } from "@/lib/services";
import styles from "./public-site.module.css";

export default async function Home() {
  const services = await getPublicServices();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <Hero />
      <TrustBar />
      <ServicesSection compact services={services} />
      <AboutSection />
      <PublicFooter />
    </main>
  );
}
