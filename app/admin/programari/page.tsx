import { canAccess, requireFeature } from "@/lib/admin-features";
import { getAdminAppointments } from "@/lib/appointments";
import { getPublicBlockedDates, getPublicScheduleSlots } from "@/lib/schedule";
import { AppointmentsPanel } from "./AppointmentsPanel";

export default async function AdminAppointmentsPage() {
  const currentUser = await requireFeature("appointments.view");
  const [appointments, blockedPeriods, scheduleSlots] = await Promise.all([
    getAdminAppointments(),
    getPublicBlockedDates(),
    getPublicScheduleSlots(),
  ]);

  return (
    <>
      <AppointmentsPanel
        appointments={appointments}
        blockedPeriods={blockedPeriods.map((period) => ({
          date: period.date,
          endDate: period.endDate,
          endTime: period.endTime,
          startTime: period.startTime,
        }))}
        canManageAppointments={canAccess(currentUser, "appointments.manage")}
        scheduleSlots={scheduleSlots.map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          durationMin: slot.durationMin,
          endTime: slot.endTime,
          id: slot.id,
          startTime: slot.startTime,
        }))}
      />
    </>
  );
}
