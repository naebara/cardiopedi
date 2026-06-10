import { AboutSection, Hero, TrustBar } from "./components/Sections";
import { PublicFooter, PublicHeader } from "./components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import styles from "./public-site.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const schedule = await getPublicScheduleSlots();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <Hero />
      <TrustBar />
      <AboutSection />
      <PublicFooter schedule={schedule} />
    </main>
  );
}
