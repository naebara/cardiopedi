import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/app/components/PublicLayout";
import type { PublicScheduleSlot } from "@/lib/schedule";
import styles from "@/app/public-site.module.css";
import { articleBlocks, hypertensionArticle } from "./i18n";

export function HypertensionArticleView({ schedule }: { schedule: PublicScheduleSlot[] }) {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <article className={styles.articlePage}>
        <Link className={styles.inlineLink} href="/ghiduri-medicale">
          <ArrowLeft size={16} /> {hypertensionArticle.back}
        </Link>
        <p className={styles.eyebrow}>{hypertensionArticle.label}</p>
        <h1>{hypertensionArticle.title}</h1>
        <p className={styles.articleLead}>{hypertensionArticle.lead}</p>
        <div className={styles.articleContent}>
          {articleBlocks.map((block, index) => {
            if ("items" in block) {
              const List = block.type;
              return (
                <List key={index}>
                  {block.items.map((item) => <li key={item}>{item}</li>)}
                </List>
              );
            }

            const Element = block.type;
            return <Element key={index}>{block.text}</Element>;
          })}
        </div>
      </article>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
