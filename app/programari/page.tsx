import { BookingForm } from "../components/BookingForm";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import styles from "../public-site.module.css";

export default function AppointmentsPage() {
  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.bookingPage}>
        <div className={styles.bookingIntro}>
          <p className={styles.eyebrow}>Programari</p>
          <h1>Programare rapida, fara cont.</h1>
          <p>Selecteaza data, ora si lasa datele de contact.</p>
        </div>
        <BookingForm />
      </section>
      <PublicFooter />
    </main>
  );
}
