import { CalendarDays, HeartPulse, LayoutDashboard, LockKeyhole, Settings, Stethoscope, UsersRound } from "lucide-react";
import { SignOutButton } from "@/app/components/sign-out-button";
import { AdminNavItem } from "./components/AdminNavItem";
import { AdminContentWrapper } from "./components/AdminContentWrapper";
import { canAccess, getCurrentAdminUser } from "@/lib/admin-features";
import styles from "./admin.module.css";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, feature: "admin.dashboard.view" as const },
  { href: "/admin/programari", label: "Programari", icon: CalendarDays, feature: "appointments.view" as const },
  { href: "/admin/pacienti", label: "Pacienti", icon: UsersRound, feature: "patients.view" as const },
  { href: "/admin/setari/program", label: "Program cabinet", icon: Settings, feature: "schedule.manage" as const },
  { href: "/admin/setari/servicii", label: "Servicii & tarife", icon: HeartPulse, feature: "services.manage" as const },
  { href: "/admin/users", label: "Utilizatori", icon: LockKeyhole, feature: "users.manage" as const },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAdminUser();
  const visibleItems = navItems.filter((item) => canAccess(user, item.feature));

  return (
    <main className={styles.adminShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}><Stethoscope size={22} /></span>
          <div>
            <strong>Cardiopedi</strong>
            <span>Admin doctor</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <AdminNavItem href={item.href} key={item.href}>
                <Icon size={18} />
                {item.label}
              </AdminNavItem>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.muted}>{user.name || user.email}</p>
          {user.isMasterUser ? <span className={styles.badge}>Master user</span> : null}
          <div style={{ marginTop: 14 }}>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <AdminContentWrapper>{children}</AdminContentWrapper>
    </main>
  );
}
