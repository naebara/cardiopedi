import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { medicalGuideArticles } from "@/lib/medical-guides";
import styles from "../public-site.module.css";

export const dynamic = "force-dynamic";

export default async function MedicalGuidesPage() {
  const schedule = await getPublicScheduleSlots();

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.guidesHero}>
        <div>
          <h1>Articole</h1>
          <p>Informații utile pentru părinți, explicate pe înțelesul tuturor.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.guidesSection}`}>
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

      <PublicFooter schedule={schedule} />
    </main>
  );
}
