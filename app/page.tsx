import { AboutSection, Hero, ServicesSection, TrustBar } from "./components/Sections";
import { PublicFooter, PublicHeader } from "./components/PublicLayout";
import styles from "./public-site.module.css";

export default function Home() {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <Hero />
      <TrustBar />
      <ServicesSection compact />
      <AboutSection />
      <PublicFooter />
    </main>
  );
}
