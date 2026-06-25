import Image from "next/image";
import Link from "next/link";
import { Activity, ArrowRight, Baby, CalendarCheck, CheckCircle2, Clock, HeartPulse, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import type { PublicScheduleSlot } from "@/lib/schedule";
import type { PublicService } from "@/lib/services";
import { clinic } from "../site-data";
import styles from "../public-site.module.css";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>{clinic.domain}</p>
        <h1>Cardiologie pediatrică cu timp, răbdare și grijă pentru fiecare copil.</h1>
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

export function ServicesSection({ compact = false, services }: { compact?: boolean; services: PublicService[] }) {
  const visibleServices = services.slice(0, compact ? 3 : services.length);

  if (visibleServices.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Servicii si tarife</p>
        <h2>Investigatii esentiale pentru inima copilului.</h2>
      </div>

      <div className={styles.serviceGrid}>
        {visibleServices.map((service) => (
          <article className={styles.serviceCard} key={service.id}>
            <div className={styles.cardIcon}><Stethoscope size={22} /></div>
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <strong>
              {service.hasActiveDiscount && service.displayDiscountedPrice ? (
                <>
                  {service.displayDiscountedPrice} <span>{service.displayPrice}</span>
                </>
              ) : (
                service.displayPrice
              )}
            </strong>
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

export function ScheduleSection({ schedule }: { schedule: PublicScheduleSlot[] }) {
  if (schedule.length === 0) {
    return null;
  }

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
          <div key={item.id}>
            <span><Clock size={18} /> {item.dayLabel}</span>
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

export function MedicalTeam() {
  const team: Array<{
    initials: string;
    name: string;
    photoClassName?: string;
    photo?: string;
    role: string;
    text: string;
  }> = [
    {
      initials: "MB",
      name: "Dr. Mihaela Bădulescu",
      photo: "/team/mihaela-badulescu.png",
      role: "Medic specialist cardiologie pediatrică",
      text:
        "Medic specialist cardiologie pediatrică, cu pregătire în cadrul Institutului de Urgență pentru Boli Cardiovasculare și Transplant Târgu Mureș. Este membră a Association for European Paediatric and Congenital Cardiology (AEPC) și participă constant la cursuri și congrese de specialitate dedicate cardiologiei pediatrice și bolilor cardiace congenitale.",
    },
    {
      initials: "IP",
      name: "Ioana Pașca",
      photo: "/team/ioana-pasca.jpeg",
      photoClassName: styles.teamPhotoIoana,
      role: "Asistent medical",
      text:
        "Cu o experiență de peste 20 de ani în domeniul pediatriei, Ioana Pașca este un sprijin important pentru copii și familiile acestora. Prin profesionalism, răbdare și empatie, contribuie la crearea unui mediu sigur și prietenos, în care cei mici se simt în largul lor, iar părinții primesc sprijin și îndrumare pe tot parcursul vizitei.",
    },
  ];

  return (
    <section className={styles.teamSection}>
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Echipa medicală</p>
        <h2>O echipă cu experiență în îngrijirea copiilor și comunicarea cu familia.</h2>
      </div>

      <div className={styles.teamGrid}>
        {team.map((member) => {
          const photo = member.photo;

          return (
            <article className={styles.teamMember} key={member.name}>
              <div className={styles.teamAvatar}>
                {photo ? (
                  <Image
                    src={photo}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className={[styles.teamPhoto, member.photoClassName].filter(Boolean).join(" ")}
                  />
                ) : (
                  <>
                    <UserRound size={28} />
                    <strong>{member.initials}</strong>
                  </>
                )}
              </div>
              <div>
                <h3>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
                <p>{member.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
