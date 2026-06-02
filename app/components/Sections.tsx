import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, Baby, CalendarCheck, CheckCircle2, Clock, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";
import { clinic, schedule, services } from "../site-data";
import styles from "../public-site.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>{clinic.domain}</p>
        <h1>Cardiologie pediatrica cu timp, rabdare si raspunsuri clare.</h1>
        <p>
          Consultatii de specialitate, ecocardiografie, EKG si monitorizari pentru copii,
          intr-un cabinet gandit pentru familie.
        </p>
        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} href="/programari">
            Fa o programare <ArrowRight size={18} />
          </Link>
          <Link className={styles.secondaryButton} href="/servicii">
            Vezi serviciile
          </Link>
        </div>
      </div>
      <div className={styles.heroImageWrap}>
        <Image
          src="/cardiopedi-clinic-hero.png"
          alt="Cabinet modern de cardiologie pediatrica"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 52vw"
          className={styles.heroImage}
        />
      </div>
    </section>
  );
}

export function TrustBar() {
  const items = [
    { icon: <Baby size={22} />, label: "Evaluare adaptata copiilor" },
    { icon: <HeartPulse size={22} />, label: "Cardiologie pediatrica" },
    { icon: <CalendarCheck size={22} />, label: "Programare fara cont" },
  ];

  return (
    <section className={styles.trustBar}>
      {items.map((item) => (
        <div key={item.label}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </section>
  );
}

export function ServicesSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Servicii si tarife</p>
        <h2>Investigatii esentiale pentru inima copilului.</h2>
        <p>Tarifele pot fi actualizate rapid in site atunci cand apar schimbari.</p>
      </div>

      <div className={styles.serviceGrid}>
        {services.slice(0, compact ? 3 : services.length).map((service) => (
          <article className={styles.serviceCard} key={service.name}>
            <div className={styles.cardIcon}><Stethoscope size={22} /></div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <strong>{service.price}</strong>
          </article>
        ))}
      </div>

      {compact ? (
        <Link className={styles.inlineLink} href="/servicii">
          Toate serviciile <ArrowRight size={16} />
        </Link>
      ) : null}
    </section>
  );
}

export function ScheduleSection() {
  return (
    <section className={styles.splitSection}>
      <div>
        <p className={styles.eyebrow}>Program cabinet</p>
        <h2>Intervale clare, cu programari la 30 de minute.</h2>
        <p>
          Programarile sunt gandite pentru evaluari atente. Daca un caz are nevoie de mai mult timp,
          consultatia poate depasi intervalul planificat.
        </p>
        <Link className={styles.primaryButton} href="/programari">
          Programeaza online
        </Link>
      </div>

      <div className={styles.schedulePanel}>
        {schedule.map((item) => (
          <div key={item.day}>
            <span><Clock size={18} /> {item.day}</span>
            <strong>{item.interval}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AboutSection() {
  return (
    <section className={styles.aboutBand}>
      <div className={styles.aboutGrid}>
        <div>
          <p className={styles.eyebrow}>Despre Cardiopedi</p>
          <h2>Un cabinet pentru consultatii cardiologice pediatrice explicate pe intelesul familiei.</h2>
        </div>
        <div>
          <p>
            Cardiopedi este construit ca un loc in care copilul este evaluat atent, iar parintii primesc
            raspunsuri clare despre investigatii, diagnostic si pasii urmatori.
          </p>
          <div className={styles.featureList}>
            <span><CheckCircle2 size={18} /> Consultatii fara graba</span>
            <span><CheckCircle2 size={18} /> Investigatii cardiologice in cabinet</span>
            <span><CheckCircle2 size={18} /> Comunicare clara cu familia</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CarePrinciples() {
  const items = [
    { icon: <ShieldCheck size={22} />, title: "Siguranta", text: "Evaluare medicala riguroasa si recomandari explicate." },
    { icon: <Activity size={22} />, title: "Investigatii", text: "EKG, ecocardiografie si monitorizari cand sunt necesare." },
    { icon: <Baby size={22} />, title: "Copii", text: "Ton calm, rabdare si atentie la confortul copilului." },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.principleGrid}>
        {items.map((item) => (
          <article key={item.title}>
            <span>{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
