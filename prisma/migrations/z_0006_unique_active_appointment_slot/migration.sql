/*
  Migration: z_0006_unique_active_appointment_slot
  Description: prevent double booking active appointment slots
  Date: 2026-06-02T00:00:00.000Z
*/

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_active_slot_key"
ON "Appointment"("date", "time")
WHERE "status" <> 'CANCELLED';

/*
  ROLLBACK PLAN:
  DROP INDEX "Appointment_active_slot_key";
*/
