/*
  Migration: z_0005_clinic_schedule_slots
  Description: configurable clinic schedule slots
  Date: 2026-06-02T00:00:00.000Z
*/

-- CreateTable
CREATE TABLE "ClinicScheduleSlot" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicScheduleSlot_dayOfWeek_idx" ON "ClinicScheduleSlot"("dayOfWeek");

-- CreateIndex
CREATE INDEX "ClinicScheduleSlot_isPaused_idx" ON "ClinicScheduleSlot"("isPaused");

-- CreateIndex
CREATE INDEX "ClinicScheduleSlot_sortOrder_idx" ON "ClinicScheduleSlot"("sortOrder");

/*
  ROLLBACK PLAN:
  DROP TABLE "ClinicScheduleSlot";
*/
