/*
  Migration: z_0003_medical_services
  Description: configurable medical services and pricing
  Date: 2026-06-02T00:00:00.000Z
*/

-- CreateTable
CREATE TABLE "MedicalService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RON',
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "discountPercent" INTEGER,
    "discountStartsAt" TIMESTAMP(3),
    "discountEndsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalService_isPaused_idx" ON "MedicalService"("isPaused");

-- CreateIndex
CREATE INDEX "MedicalService_sortOrder_idx" ON "MedicalService"("sortOrder");

/*
  ROLLBACK PLAN:
  DROP TABLE "MedicalService";
*/
