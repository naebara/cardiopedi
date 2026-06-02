import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { clinic, schedule } from "../site-data";
import styles from "../public-site.module.css";

export default function ContactPage() {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.contactPage}>
        <div>
          <p className={styles.eyebrow}>Contact</p>
          <h1>Ai nevoie de o programare sau de detalii despre servicii?</h1>
          <p>Completeaza formularul de programare sau foloseste datele de contact ale cabinetului.</p>
          <Link className={styles.primaryButton} href="/programari">
            Fa o programare
          </Link>
        </div>

        <div className={styles.contactPanel}>
          <p><Phone size={18} /> {clinic.phone}</p>
          <p><Mail size={18} /> {clinic.email}</p>
          <p><MapPin size={18} /> {clinic.address}</p>
          <hr />
          {schedule.map((item) => (
            <p key={item.day}>
              <span>{item.day}</span>
              <strong>{item.interval}</strong>
            </p>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
