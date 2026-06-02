import { BookingForm } from "../components/BookingForm";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { getPublicServices } from "@/lib/services";
import styles from "../public-site.module.css";

export default async function AppointmentsPage() {
  const services = await getPublicServices();
  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
  }));

  return (
    <main className={styles.siteShell}>
      <PublicHeader />
      <section className={styles.bookingPage}>
        <div className={styles.bookingIntro}>
          <p className={styles.eyebrow}>Programari</p>
          <h1>Programare rapida, fara cont.</h1>
          <p>Selecteaza data, ora si lasa datele de contact.</p>
        </div>
        <BookingForm services={serviceOptions} />
      </section>
      <PublicFooter />
    </main>
  );
}
