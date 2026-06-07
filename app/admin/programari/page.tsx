import { canAccess, requireFeature } from "@/lib/admin-features";
import { getAdminAppointments } from "@/lib/appointments";
import { getPublicScheduleSlots } from "@/lib/schedule";
import { AppointmentsPanel } from "./AppointmentsPanel";

export default async function AdminAppointmentsPage() {
  const currentUser = await requireFeature("appointments.view");
  const [appointments, scheduleSlots] = await Promise.all([
    getAdminAppointments(),
    getPublicScheduleSlots(),
  ]);

  return (
    <>
      <AppointmentsPanel
        appointments={appointments}
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
