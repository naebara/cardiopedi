import { prisma } from "@/lib/prisma";

export type MedicalService = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  isPaused: boolean;
  discountEnabled: boolean;
  discountPercent: number;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicService = MedicalService & {
  displayPrice: string;
  hasActiveDiscount: boolean;
  discountedPriceCents: number | null;
  displayDiscountedPrice: string | null;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("ro-RO", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function hasActiveDiscount(service: MedicalService, now = new Date()) {
  if (!service.discountEnabled || service.discountPercent <= 0) {
    return false;
  }

  if (service.discountStartsAt && service.discountStartsAt > now) {
    return false;
  }

  if (service.discountEndsAt && service.discountEndsAt < now) {
    return false;
  }

  return true;
}

export function serviceWithDisplayPrice(service: MedicalService): PublicService {
  const activeDiscount = hasActiveDiscount(service);
  const discountedPriceCents = activeDiscount
    ? Math.max(0, Math.round(service.priceCents * (100 - service.discountPercent) / 100))
    : null;

  return {
    ...service,
    discountedPriceCents,
    displayDiscountedPrice: discountedPriceCents === null ? null : formatPrice(discountedPriceCents, service.currency),
    displayPrice: formatPrice(service.priceCents, service.currency),
    hasActiveDiscount: activeDiscount,
  };
}

export async function getAdminServices() {
  return prisma.$queryRaw<MedicalService[]>`
    SELECT
      "id",
      "name",
      "description",
      "priceCents",
      "currency",
      "isPaused",
      "discountEnabled",
      "discountPercent",
      "discountStartsAt",
      "discountEndsAt",
      "sortOrder",
      "createdAt",
      "updatedAt"
    FROM "MedicalService"
    ORDER BY "sortOrder" ASC, "createdAt" ASC
  `;
}

export async function getPublicServices() {
  const services = await prisma.$queryRaw<MedicalService[]>`
    SELECT
      "id",
      "name",
      "description",
      "priceCents",
      "currency",
      "isPaused",
      "discountEnabled",
      "discountPercent",
      "discountStartsAt",
      "discountEndsAt",
      "sortOrder",
      "createdAt",
      "updatedAt"
    FROM "MedicalService"
    WHERE "isPaused" = false
    ORDER BY "sortOrder" ASC, "createdAt" ASC
  `;

  return services.map(serviceWithDisplayPrice);
}
