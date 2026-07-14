import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const ADMIN_FEATURES = [
  {
    key: "appointments.view",
    name: "Vizualizare programari",
    description: "Poate vedea programarile in calendar si lista.",
    category: "Programari",
  },
  {
    key: "appointments.manage",
    name: "Gestionare programari",
    description: "Poate confirma, anula sau modifica programari.",
    category: "Programari",
  },
  {
    key: "patients.view",
    name: "Vizualizare pacienti",
    description: "Poate vedea fisele individuale asociate programarilor.",
    category: "Pacienti",
  },
  {
    key: "patients.manage",
    name: "Gestionare pacienti",
    description: "Poate sterge fise si programarile asociate.",
    category: "Pacienti",
  },
  {
    key: "services.manage",
    name: "Gestionare servicii si tarife",
    description: "Poate modifica serviciile si tarifele site-ului.",
    category: "Setari",
  },
  {
    key: "schedule.manage",
    name: "Gestionare program cabinet",
    description: "Poate modifica zilele, orele si intervalele de programare.",
    category: "Setari",
  },
  {
    key: "users.manage",
    name: "Gestionare utilizatori",
    description: "Poate acorda sau retrage acces la feature-uri.",
    category: "Utilizatori",
  },
] as const;

export type AdminFeatureKey = (typeof ADMIN_FEATURES)[number]["key"];

export type AdminUserAccess = {
  id: string;
  name: string | null;
  email: string;
  isMasterUser: boolean;
  features: AdminFeatureKey[];
};

type UserFlagRow = {
  id: string;
  name: string | null;
  email: string;
  isMasterUser: boolean;
};

type FeatureGrantRow = {
  featureKey: AdminFeatureKey;
};

export function isKnownFeature(value: string): value is AdminFeatureKey {
  return ADMIN_FEATURES.some((feature) => feature.key === value);
}

export async function getCurrentAdminUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return getUserAccess(session.user.id);
}

export async function getUserAccess(userId: string): Promise<AdminUserAccess> {
  const users = await prisma.$queryRaw<UserFlagRow[]>`
    SELECT "id", "name", "email", "isMasterUser"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  const user = users[0];
  if (!user) {
    redirect("/login");
  }

  if (user.isMasterUser) {
    return {
      ...user,
      features: ADMIN_FEATURES.map((feature) => feature.key),
    };
  }

  const grants = await prisma.$queryRaw<FeatureGrantRow[]>`
    SELECT "featureKey"
    FROM "UserFeatureGrant"
    WHERE "userId" = ${userId}
  `;

  return {
    ...user,
    features: grants.map((grant) => grant.featureKey).filter(isKnownFeature),
  };
}

export function canAccess(user: AdminUserAccess, feature: AdminFeatureKey) {
  return user.isMasterUser || user.features.includes(feature);
}

export async function requireFeature(feature: AdminFeatureKey) {
  const user = await getCurrentAdminUser();

  if (!canAccess(user, feature)) {
    redirect("/admin/no-access");
  }

  return user;
}

export async function requireMasterUser() {
  const user = await getCurrentAdminUser();

  if (!user.isMasterUser) {
    redirect("/admin/no-access");
  }

  return user;
}
