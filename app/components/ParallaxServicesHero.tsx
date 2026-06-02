"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../public-site.module.css";

export function ParallaxServicesHero() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let frame = 0;

    function updateOffset() {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      setOffset(rect.top * -0.22);
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateOffset);
    }

    updateOffset();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.pageHero} ${styles.servicesHero}`}>
      <div
        className={styles.servicesHeroImage}
        style={{ transform: `translate3d(0, ${offset}px, 0)` }}
        aria-hidden="true"
      />
      <div className={styles.servicesHeroOverlay} aria-hidden="true" />
      <div className={styles.servicesHeroContent}>
        <p className={styles.eyebrow}>Servicii</p>
        <h1>Tarife transparente pentru evaluari cardiologice pediatrice.</h1>
        <p>Aici sunt serviciile initiale comunicate pentru Cardiopedi.</p>
      </div>
    </section>
  );
}
