import { BookingForm } from "../components/BookingForm";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { getOccupiedAppointmentSlots } from "@/lib/appointments";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { getPublicServices } from "@/lib/services";
import styles from "../public-site.module.css";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const [services, schedule, occupiedSlots] = await Promise.all([
    getPublicServices(),
    getPublicScheduleSlots(),
    getOccupiedAppointmentSlots(),
  ]);
  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
  }));
  const scheduleOptions = schedule.map((slot) => ({
    dayOfWeek: slot.dayOfWeek,
    durationMin: slot.durationMin,
    endTime: slot.endTime,
    id: slot.id,
    startTime: slot.startTime,
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
        <BookingForm occupiedSlots={occupiedSlots} schedule={scheduleOptions} services={serviceOptions} />
      </section>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
