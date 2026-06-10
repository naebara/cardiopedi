ALTER TABLE "ClinicBlockedDate"
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "startTime" TEXT,
ADD COLUMN "endTime" TEXT;

UPDATE "ClinicBlockedDate"
SET "endDate" = "date"
WHERE "endDate" IS NULL;

CREATE INDEX "ClinicBlockedDate_endDate_idx" ON "ClinicBlockedDate"("endDate");
