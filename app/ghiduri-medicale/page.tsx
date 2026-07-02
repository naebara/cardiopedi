import Link from "next/link";
import { ArrowRight, BookOpenText, FileText } from "lucide-react";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { getMedicalGuideDocuments, medicalGuideArticles } from "@/lib/medical-guides";
import styles from "../public-site.module.css";

export const dynamic = "force-dynamic";

export default async function MedicalGuidesPage() {
  const [schedule, documents] = await Promise.all([
    getPublicScheduleSlots(),
    getMedicalGuideDocuments(),
  ]);

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.guidesHero}>
        <div>
          <h1>Ghiduri medicale</h1>
          <p>Articole si documente utile pentru cardiologia pediatrica.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.guidesSection}`}>
        <div className={styles.sectionHeader}>
          <h2>Articole</h2>
        </div>
        <div className={styles.guideGrid}>
          {medicalGuideArticles.map((guide) => (
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

      <section className={`${styles.section} ${styles.guidesSection}`}>
        <div className={styles.sectionHeader}>
          <h2>Ghiduri medicale</h2>
        </div>
        <ul className={styles.guideList}>
          {documents.map((guide) => (
            <li key={guide.href}>
              <Link className={styles.guideListLink} href={guide.href}>
                <span className={styles.guideListIcon}><FileText size={18} /></span>
                <span className={styles.guideListTitle}>{guide.title}</span>
                <ArrowRight size={17} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PublicFooter schedule={schedule} />
    </main>
  );
}
