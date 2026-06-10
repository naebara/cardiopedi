ALTER TABLE "User"
ADD COLUMN "receivesAppointmentEmails" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "receivesAppointmentEmails" = true
WHERE "isMasterUser" = true;

CREATE TABLE "ClinicBlockedDate" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,

  CONSTRAINT "ClinicBlockedDate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClinicBlockedDate_date_key" ON "ClinicBlockedDate"("date");
CREATE INDEX "ClinicBlockedDate_date_idx" ON "ClinicBlockedDate"("date");
