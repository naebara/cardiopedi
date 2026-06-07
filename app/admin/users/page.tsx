import { ADMIN_FEATURES, requireMasterUser } from "@/lib/admin-features";
import { prisma } from "@/lib/prisma";
import { UsersManager } from "./UsersManager";
import styles from "../admin.module.css";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  isMasterUser: boolean;
};

type GrantRow = {
  userId: string;
  featureKey: string;
};

async function getUsersWithAccess() {
  const [users, grants] = await Promise.all([
    prisma.$queryRaw<UserRow[]>`
      SELECT "id", "name", "email", "isMasterUser"
      FROM "User"
      ORDER BY "createdAt" ASC
    `,
    prisma.$queryRaw<GrantRow[]>`
      SELECT "userId", "featureKey"
      FROM "UserFeatureGrant"
    `,
  ]);

  return users.map((user) => ({
    ...user,
    features: grants.filter((grant) => grant.userId === user.id).map((grant) => grant.featureKey),
  }));
}

export default async function AdminUsersPage() {
  const currentUser = await requireMasterUser();
  const users = await getUsersWithAccess();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Utilizatori</h1>
          <p>Master user poate acorda acces punctual la feature-uri pentru ceilalti utilizatori.</p>
        </div>
        <span className={styles.badge}>Master only</span>
      </header>

      <UsersManager currentUserId={currentUser.id} features={ADMIN_FEATURES} users={users} />
    </>
  );
}
