CREATE TABLE "DeletedPatient" (
  "id" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedBy" TEXT,

  CONSTRAINT "DeletedPatient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeletedPatient_normalizedName_key" ON "DeletedPatient"("normalizedName");
CREATE INDEX "DeletedPatient_deletedAt_idx" ON "DeletedPatient"("deletedAt");
