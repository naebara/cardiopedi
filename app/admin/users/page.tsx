import { updateUserAccess } from "@/app/admin/actions";
import { ADMIN_FEATURES, requireMasterUser } from "@/lib/admin-features";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "./CreateUserForm";
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

      <CreateUserForm features={ADMIN_FEATURES} />

      <section className={styles.grid}>
        {users.map((user) => (
          <form action={updateUserAccess} className={styles.card} key={user.id}>
            <input name="userId" type="hidden" value={user.id} />
            <h2>{user.name || user.email}</h2>
            <p className={styles.muted}>{user.email}</p>

            <label className={styles.masterToggle}>
              <input
                defaultChecked={user.isMasterUser}
                disabled={user.id === currentUser.id}
                name="isMasterUser"
                type="checkbox"
              />
              Master user
            </label>

            <div className={styles.featureGrid}>
              {ADMIN_FEATURES.map((feature) => (
                <label className={styles.featureCheck} key={feature.key}>
                  <input
                    defaultChecked={user.isMasterUser || user.features.includes(feature.key)}
                    disabled={user.isMasterUser}
                    name="features"
                    type="checkbox"
                    value={feature.key}
                  />
                  <span>
                    <strong>{feature.name}</strong>
                    {feature.description}
                  </span>
                </label>
              ))}
            </div>

            <button className={styles.saveButton} type="submit">
              Salveaza accesul
            </button>
          </form>
        ))}
      </section>
    </>
  );
}
