import { requireFeature } from "@/lib/admin-features";
import { getAdminAppointments } from "@/lib/appointments";
import { AppointmentsPanel } from "./AppointmentsPanel";

export default async function AdminAppointmentsPage() {
  await requireFeature("appointments.view");
  const appointments = await getAdminAppointments();

  return (
    <>
      <AppointmentsPanel appointments={appointments} />
    </>
  );
}
