"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Highlighting logic:
  // - Dashboard is active only if exact match ("/admin")
  // - Other pages are active if pathname starts with href (e.g. "/admin/programari/...")
  const isActive = href === "/admin" 
    ? pathname === "/admin"
    : pathname?.startsWith(href);

  return (
    <Link href={href} data-active={isActive ? "true" : undefined}>
      {children}
    </Link>
  );
}
