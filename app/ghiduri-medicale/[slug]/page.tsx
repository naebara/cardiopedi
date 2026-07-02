import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/app/components/PublicLayout";
import styles from "@/app/public-site.module.css";
import { getMedicalGuideDocumentBySlug } from "@/lib/medical-guides";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { MedicalGuidePdfViewer } from "./MedicalGuidePdfViewer";

export const dynamic = "force-dynamic";

type MedicalGuideDocumentPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: MedicalGuideDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getMedicalGuideDocumentBySlug(slug);

  return {
    title: guide ? `${guide.title} | Ghiduri medicale` : "Ghid medical",
  };
}

export default async function MedicalGuideDocumentPage({ params }: MedicalGuideDocumentPageProps) {
  const { slug } = await params;
  const [guide, schedule] = await Promise.all([
    getMedicalGuideDocumentBySlug(slug),
    getPublicScheduleSlots(),
  ]);

  if (!guide) {
    notFound();
  }

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <article className={styles.documentPage}>
        <Link className={styles.inlineLink} href="/ghiduri-medicale">
          <ArrowLeft size={16} /> Înapoi la ghiduri
        </Link>
        <p className={styles.eyebrow}>Ghid medical</p>
        <h1>{guide.title}</h1>
        <MedicalGuidePdfViewer src={`${guide.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`} title={guide.title} />
      </article>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
