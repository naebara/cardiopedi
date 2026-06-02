"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import styles from "../admin.module.css";

interface AdminSidebarProps {
  children: React.ReactNode;
}

export function AdminSidebar({ children }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);

  // Close sidebar on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only on mobile via CSS */}
      <button
        className={styles.hamburger}
        onClick={() => setOpen(true)}
        aria-label="Deschide meniu"
        type="button"
      >
        <Menu size={24} />
      </button>

      {/* Overlay — visible only on mobile when open */}
      {open && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) {
            setOpen(false);
          }
        }}
      >
        <button
          className={styles.sidebarClose}
          onClick={() => setOpen(false)}
          aria-label="Inchide meniu"
          type="button"
        >
          <X size={22} />
        </button>
        {children}
      </aside>
    </>
  );
}
