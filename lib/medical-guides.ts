import "server-only";

import { readdir } from "fs/promises";
import path from "path";

const MEDICAL_GUIDES_DIRECTORY = path.join(process.cwd(), "content", "medical-guides");

export const medicalGuideArticles = [
  {
    excerpt:
      "Un suflu cardiac nu înseamnă automat o problemă a inimii. Află când este funcțional, când necesită investigații și ce urmărește evaluarea cardiologică.",
    href: "/ghiduri-medicale/suflul-sistolic-la-copil",
    slug: "suflul-sistolic-la-copil",
    title: "Suflul sistolic la copil - trebuie să ne îngrijorăm?",
  },
];

export const medicalGuides = medicalGuideArticles;

export type MedicalGuideDocument = {
  absolutePath: string;
  fileName: string;
  href: string;
  pdfUrl: string;
  slug: string;
  title: string;
};

const uppercaseWords = new Set([
  "aacvpr",
  "abc",
  "acc",
  "acpm",
  "ada",
  "aepc",
  "ags",
  "aha",
  "apha",
  "aspc",
  "ceid",
  "cpvt",
  "cv",
  "esc",
  "htp",
  "nla",
  "paces",
  "pcna",
  "qt",
  "svt",
]);

const lowercaseWords = new Set(["and", "cu", "de", "for", "from", "in", "la", "of", "si", "the"]);

export async function getMedicalGuideDocuments(): Promise<MedicalGuideDocument[]> {
  let entries;

  try {
    entries = await readdir(MEDICAL_GUIDES_DIRECTORY, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const seenSlugs = new Map<string, number>();

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => entry.name)
    .sort((first, second) => first.localeCompare(second, "ro"))
    .map((fileName, index) => {
      const title = formatGuideTitle(fileName);
      const slug = uniqueSlug(slugify(fileName.replace(/\.pdf$/i, "")) || `ghid-${index + 1}`, seenSlugs);

      return {
        absolutePath: path.join(MEDICAL_GUIDES_DIRECTORY, fileName),
        fileName,
        href: `/ghiduri-medicale/${slug}`,
        pdfUrl: `/api/medical-guides/${slug}`,
        slug,
        title,
      };
    });
}

export async function getMedicalGuideDocumentBySlug(slug: string) {
  const documents = await getMedicalGuideDocuments();

  return documents.find((document) => document.slug === slug) ?? null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueSlug(slug: string, seenSlugs: Map<string, number>) {
  const count = seenSlugs.get(slug) ?? 0;
  seenSlugs.set(slug, count + 1);

  return count === 0 ? slug : `${slug}-${count + 1}`;
}

function formatGuideTitle(fileName: string) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word, index) => formatTitleWord(word, index))
    .join(" ");
}

function formatTitleWord(word: string, index: number) {
  const lowerWord = word.toLowerCase();

  if (uppercaseWords.has(lowerWord)) {
    return lowerWord.toUpperCase();
  }

  if (lowercaseWords.has(lowerWord) && index > 0) {
    return lowerWord;
  }

  if (/^\d+$/.test(word)) {
    return word;
  }

  return `${lowerWord.charAt(0).toUpperCase()}${lowerWord.slice(1)}`;
}
