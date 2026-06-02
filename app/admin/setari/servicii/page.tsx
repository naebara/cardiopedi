import { requireFeature } from "@/lib/admin-features";
import { getAdminServices, serviceWithDisplayPrice } from "@/lib/services";
import { ServicesManager, type ServiceRow } from "./ServicesManager";

function priceInputValue(priceCents: number) {
  return (priceCents / 100).toFixed(0);
}

function dateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default async function AdminServicesSettingsPage() {
  await requireFeature("services.manage");
  const services = await getAdminServices();

  const serviceRows: ServiceRow[] = services.map((service) => {
    const priced = serviceWithDisplayPrice(service);

    return {
      currency: service.currency,
      description: service.description,
      discountEnabled: service.discountEnabled,
      discountEndsAt: dateInputValue(service.discountEndsAt),
      discountPercent: service.discountPercent,
      discountStartsAt: dateInputValue(service.discountStartsAt),
      displayDiscountedPrice: priced.displayDiscountedPrice,
      displayPrice: priced.displayPrice,
      hasActiveDiscount: priced.hasActiveDiscount,
      id: service.id,
      isPaused: service.isPaused,
      name: service.name,
      priceCents: service.priceCents,
      priceRon: priceInputValue(service.priceCents),
      sortOrder: service.sortOrder,
    };
  });

  return <ServicesManager services={serviceRows} />;
}
