/*
  Migration: z_0002_admin_features
  Description: admin panel feature flags and appointments
  Date: 2026-06-02T00:00:00.000Z
*/

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('NEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isMasterUser" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Feature" (
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "UserFeatureGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "UserFeatureGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "service" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'NEW',
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFeatureGrant_userId_featureKey_key" ON "UserFeatureGrant"("userId", "featureKey");

-- CreateIndex
CREATE INDEX "UserFeatureGrant_featureKey_idx" ON "UserFeatureGrant"("featureKey");

-- CreateIndex
CREATE INDEX "Appointment_date_idx" ON "Appointment"("date");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- AddForeignKey
ALTER TABLE "UserFeatureGrant" ADD CONSTRAINT "UserFeatureGrant_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "Feature"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatureGrant" ADD CONSTRAINT "UserFeatureGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SeedFeatures
INSERT INTO "Feature" ("key", "name", "description", "category") VALUES
('admin.dashboard.view', 'Dashboard', 'Poate vedea rezumatul panoului de control.', 'Admin'),
('appointments.view', 'Vizualizare programari', 'Poate vedea programarile in calendar si lista.', 'Programari'),
('appointments.manage', 'Gestionare programari', 'Poate confirma, anula sau modifica programari.', 'Programari'),
('patients.view', 'Vizualizare pacienti', 'Poate vedea lista de pacienti si parinti.', 'Pacienti'),
('patients.manage', 'Gestionare pacienti', 'Poate modifica datele pacientilor.', 'Pacienti'),
('services.manage', 'Gestionare servicii si tarife', 'Poate modifica serviciile si tarifele site-ului.', 'Setari'),
('schedule.manage', 'Gestionare program cabinet', 'Poate modifica zilele, orele si intervalele de programare.', 'Setari'),
('users.manage', 'Gestionare utilizatori', 'Poate acorda sau retrage acces la feature-uri.', 'Utilizatori')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category";

/*
  ROLLBACK PLAN:
  DROP TABLE "Appointment";
  DROP TABLE "UserFeatureGrant";
  DROP TABLE "Feature";
  ALTER TABLE "User" DROP COLUMN "isMasterUser";
  DROP TYPE "AppointmentStatus";
*/
