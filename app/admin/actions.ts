"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_FEATURES, isKnownFeature, requireMasterUser } from "@/lib/admin-features";
import { prisma } from "@/lib/prisma";

export async function updateUserAccess(formData: FormData) {
  const currentUser = await requireMasterUser();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const isMasterUser = formData.get("isMasterUser") === "on";
  const grantedFeatures = formData
    .getAll("features")
    .map(String)
    .filter(isKnownFeature);

  await prisma.$executeRaw`
    UPDATE "User"
    SET "isMasterUser" = ${userId === currentUser.id ? true : isMasterUser}
    WHERE "id" = ${userId}
  `;

  await prisma.$executeRaw`
    DELETE FROM "UserFeatureGrant"
    WHERE "userId" = ${userId}
  `;

  if (!isMasterUser || userId === currentUser.id) {
    for (const feature of ADMIN_FEATURES) {
      if (!grantedFeatures.includes(feature.key)) {
        continue;
      }

      await prisma.$executeRaw`
        INSERT INTO "UserFeatureGrant" ("id", "userId", "featureKey", "createdBy")
        VALUES (${crypto.randomUUID()}, ${userId}, ${feature.key}, ${currentUser.id})
        ON CONFLICT ("userId", "featureKey") DO NOTHING
      `;
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
