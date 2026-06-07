import { redirect } from "next/navigation";
import { canAccess, getCurrentAdminUser } from "@/lib/admin-features";

export default async function AdminPage() {
  const user = await getCurrentAdminUser();

  if (canAccess(user, "appointments.view")) {
    redirect("/admin/programari");
  }

  if (canAccess(user, "patients.view")) {
    redirect("/admin/pacienti");
  }

  if (canAccess(user, "schedule.manage")) {
    redirect("/admin/setari/program");
  }

  if (canAccess(user, "services.manage")) {
    redirect("/admin/setari/servicii");
  }

  if (canAccess(user, "users.manage")) {
    redirect("/admin/users");
  }

  redirect("/admin/setari-cont");
}
