ALTER TABLE "Appointment"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedBy" TEXT;

CREATE INDEX "Appointment_deletedAt_idx" ON "Appointment"("deletedAt");

DROP INDEX "Appointment_active_slot_key";

CREATE UNIQUE INDEX "Appointment_active_slot_key"
ON "Appointment"("date", "time")
WHERE "status" <> 'CANCELLED' AND "deletedAt" IS NULL;
