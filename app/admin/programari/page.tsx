import { requireFeature } from "@/lib/admin-features";
import { AppointmentsPanel } from "./AppointmentsPanel";

export default async function AdminAppointmentsPage() {
  await requireFeature("appointments.view");

  return (
    <>
      <AppointmentsPanel />
    </>
  );
}
