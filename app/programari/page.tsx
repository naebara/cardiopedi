import { BookingForm } from "../components/BookingForm";
import { PublicFooter, PublicHeader } from "../components/PublicLayout";
import { getOccupiedAppointmentSlots } from "@/lib/appointments";
import { getPublicBlockedDates, getPublicScheduleSlots } from "@/lib/schedule";
import styles from "../public-site.module.css";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const [schedule, occupiedSlots, blockedDates] = await Promise.all([
    getPublicScheduleSlots(),
    getOccupiedAppointmentSlots(),
    getPublicBlockedDates(),
  ]);
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
        <BookingForm
          blockedPeriods={blockedDates.map((blockedDate) => ({
            date: blockedDate.date,
            endDate: blockedDate.endDate,
            endTime: blockedDate.endTime,
            startTime: blockedDate.startTime,
          }))}
          occupiedSlots={occupiedSlots}
          schedule={scheduleOptions}
        />
      </section>
      <PublicFooter schedule={schedule} />
    </main>
  );
}
