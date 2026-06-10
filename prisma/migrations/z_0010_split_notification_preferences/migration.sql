ALTER TABLE "User"
ADD COLUMN "receivesBlockedDateEmails" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "receivesBlockedDateEmails" = "receivesAppointmentEmails";
