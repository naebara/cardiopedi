"use client";

import Link from "next/link";
import { HeartPulse, MapPin, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PublicScheduleSlot } from "@/lib/schedule";
import { clinic } from "../site-data";
import styles from "../public-site.module.css";

const navigation = [
  { href: "/", label: "Acasa" },
  { href: "/servicii", label: "Servicii" },
  { href: "/programari", label: "Programari" },
  { href: "/despre", label: "Despre" },
  { href: "/ghiduri-medicale", label: "Articole" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header}>
      <Link className={styles.logo} href="/">
        <span className={styles.logoMark}><HeartPulse size={25} /></span>
        <span>
          <strong>{clinic.name}</strong>
          <small>{clinic.tagline}</small>
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Navigatie principala">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className={styles.headerCta} href="/programari">
        Programare
      </Link>

      <button
        aria-controls="mobile-navigation"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? "Inchide meniul" : "Deschide meniul"}
        className={styles.mobileMenu}
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {isMenuOpen ? (
        <div className={`${styles.mobileNavOverlay} ${styles.mobileNavOverlayOpen}`} id="mobile-navigation">
          <nav aria-label="Navigatie principala mobila" className={styles.mobileNav}>
            <div className={styles.mobileNavTop}>
              <Link className={styles.logo} href="/" onClick={() => setIsMenuOpen(false)}>
                <span className={styles.logoMark}><HeartPulse size={25} /></span>
                <span>
                  <strong>{clinic.name}</strong>
                  <small>{clinic.tagline}</small>
                </span>
              </Link>
              <button aria-label="Inchide meniul" className={styles.mobileNavClose} onClick={() => setIsMenuOpen(false)} type="button">
                <X size={24} />
              </button>
            </div>

            <div className={styles.mobileNavLinks}>
              {navigation.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>

            <Link className={styles.mobileNavCta} href="/programari" onClick={() => setIsMenuOpen(false)}>
              Fa o programare
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function PublicFooter({ schedule = [] }: { schedule?: PublicScheduleSlot[] }) {
  return (
    <footer className={styles.footer}>
      <div>
        <Link className={styles.footerLogo} href="/">
          <HeartPulse size={24} />
          {clinic.name}
        </Link>
        <p>Cardiologie pediatrica intr-un cadru calm, prietenos si atent la fiecare copil.</p>
      </div>

      {schedule.length > 0 ? (
        <div>
          <h3>Program</h3>
          <ul>
            {schedule.map((item) => (
              <li key={item.id}>
                <span>{item.dayLabel}</span>
                <strong>{item.interval}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3>Contact</h3>
        <p>
          <Phone size={16} />
          <a className={styles.mapLink} href={clinic.phoneHref}>
            {clinic.phone}
          </a>
        </p>
        <p>
          <MapPin size={16} />
          <a className={styles.mapLink} href={clinic.mapUrl} rel="noreferrer" target="_blank">
            {clinic.address}
          </a>
        </p>
      </div>
    </footer>
  );
}
