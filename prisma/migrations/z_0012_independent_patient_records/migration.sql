ALTER TABLE "Appointment"
ADD COLUMN "hiddenFromPatientsAt" TIMESTAMP(3),
ADD COLUMN "hiddenFromPatientsBy" TEXT;

DROP TABLE "DeletedPatient";
