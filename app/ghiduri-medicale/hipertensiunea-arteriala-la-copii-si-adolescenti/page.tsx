import type { Metadata } from "next";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { HypertensionArticleView } from "./HypertensionArticleView";
import { hypertensionArticle } from "./i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: hypertensionArticle.metadataTitle,
  description: hypertensionArticle.description,
};

export default async function HypertensionArticlePage() {
  const schedule = await getPublicScheduleSlots();

  return <HypertensionArticleView schedule={schedule} />;
}
