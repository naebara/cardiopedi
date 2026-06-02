/*
  Migration: z_0004_service_discount_visibility
  Description: explicit service discount publishing flag
  Date: 2026-06-02T00:00:00.000Z
*/

-- AlterTable
ALTER TABLE "MedicalService"
ADD COLUMN "discountEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "MedicalService"
SET "discountPercent" = 0
WHERE "discountPercent" IS NULL;

ALTER TABLE "MedicalService"
ALTER COLUMN "discountPercent" SET DEFAULT 0,
ALTER COLUMN "discountPercent" SET NOT NULL;

/*
  ROLLBACK PLAN:
  ALTER TABLE "MedicalService" ALTER COLUMN "discountPercent" DROP NOT NULL;
  ALTER TABLE "MedicalService" ALTER COLUMN "discountPercent" DROP DEFAULT;
  ALTER TABLE "MedicalService" DROP COLUMN "discountEnabled";
*/
