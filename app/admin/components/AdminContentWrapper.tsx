"use client";

import { usePathname } from "next/navigation";
import styles from "../admin.module.css";

export function AdminContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Remove padding entirely for the programari calendar view
  const isFullScreen = pathname === "/admin/programari";

  return (
    <section 
      className={styles.content} 
      style={isFullScreen ? { padding: 0, display: "flex", flexDirection: "column", height: "100vh" } : undefined}
    >
      {children}
    </section>
  );
}
