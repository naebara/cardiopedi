"use client";

import { useEffect } from "react";
import styles from "@/app/public-site.module.css";

type MedicalGuidePdfViewerProps = {
  src: string;
  title: string;
};

export function MedicalGuidePdfViewer({ src, title }: MedicalGuidePdfViewerProps) {
  useEffect(() => {
    function preventDownloadShortcuts(event: KeyboardEvent) {
      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && (key === "s" || key === "p")) {
        event.preventDefault();
      }
    }

    window.addEventListener("keydown", preventDownloadShortcuts, { capture: true });

    return () => {
      window.removeEventListener("keydown", preventDownloadShortcuts, { capture: true });
    };
  }, []);

  return (
    <div className={styles.pdfViewerShell} onContextMenu={(event) => event.preventDefault()}>
      <iframe
        className={styles.pdfViewer}
        src={src}
        title={title}
      />
    </div>
  );
}
