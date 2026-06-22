import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { medicalGuides } from "@/lib/medical-guides";
import styles from "../public-site.module.css";

export const dynamic = "force-dynamic";

export default async function MedicalGuidesPage() {
  const schedule = await getPublicScheduleSlots();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.pageHero}>
        <p className={styles.eyebrow}>Informații medicale</p>
        <h1>Ghiduri medicale pentru părinți, explicate clar.</h1>
        <p>Articole despre situații frecvente în cardiologia pediatrică și pașii recomandați pentru evaluare.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.guideGrid}>
          {medicalGuides.map((guide) => (
            <article className={styles.guideCard} key={guide.href}>
              <span className={styles.cardIcon}><BookOpenText size={22} /></span>
              <h2>{guide.title}</h2>
              <p>{guide.excerpt}</p>
              <Link className={styles.inlineLink} href={guide.href}>
                Citește articolul <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <PublicFooter schedule={schedule} />
    </main>
  );
}
