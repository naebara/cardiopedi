import { createMedicalService, deleteMedicalService, updateMedicalService } from "@/app/admin/actions";
import { requireFeature } from "@/lib/admin-features";
import { getAdminServices, serviceWithDisplayPrice } from "@/lib/services";
import styles from "../../admin.module.css";

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

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Servicii & tarife</h1>
          <p>Adauga serviciile afisate pe site, seteaza preturile, pauzele si reducerile temporare.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <h2>Adauga serviciu</h2>
        <form action={createMedicalService} className={styles.serviceForm}>
          <label>
            <span>Nume serviciu</span>
            <input name="name" required type="text" />
          </label>

          <label>
            <span>Descriere</span>
            <textarea name="description" rows={3} />
          </label>

          <div className={styles.formRow}>
            <label>
              <span>Pret RON</span>
              <input min="0" name="price" required step="1" type="number" />
            </label>

            <label>
              <span>Ordine</span>
              <input defaultValue="0" name="sortOrder" step="1" type="number" />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              <span>Reducere %</span>
              <input defaultValue="0" max="100" min="0" name="discountPercent" step="1" type="number" />
            </label>

            <label>
              <span>De la</span>
              <input name="discountStartsAt" type="date" />
            </label>

            <label>
              <span>Pana la</span>
              <input name="discountEndsAt" type="date" />
            </label>
          </div>

          <label className={styles.checkRow}>
            <input name="isPaused" type="checkbox" />
            <span>Pauza temporara: nu afisa serviciul pe site</span>
          </label>

          <label className={styles.checkRow}>
            <input name="discountEnabled" type="checkbox" />
            <span>Publica reducerea pe site</span>
          </label>

          <button className={styles.saveButton} type="submit">Adauga serviciu</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionTitle}>
          <h2>Servicii existente</h2>
          <span className={styles.badge}>{services.length} servicii</span>
        </div>

        {services.length === 0 ? (
          <p className={styles.muted}>Nu exista servicii adaugate.</p>
        ) : (
          <div className={styles.serviceAdminList}>
            {services.map((service) => {
              const pricedService = serviceWithDisplayPrice(service);

              return (
                <article className={styles.serviceEditor} key={service.id}>
                  <form action={updateMedicalService} className={styles.serviceForm}>
                    <input name="serviceId" type="hidden" value={service.id} />

                    <div className={styles.serviceEditorHeader}>
                      <div>
                        <h3>{service.name}</h3>
                        <p className={styles.muted}>
                          {pricedService.hasActiveDiscount && pricedService.displayDiscountedPrice
                            ? `${pricedService.displayDiscountedPrice} cu reducere, pret initial ${pricedService.displayPrice}`
                            : pricedService.displayPrice}
                        </p>
                      </div>
                      <span className={service.isPaused ? styles.statusPaused : styles.statusLive}>
                        {service.isPaused ? "In pauza" : "Afisat"}
                      </span>
                    </div>

                    <label>
                      <span>Nume serviciu</span>
                      <input defaultValue={service.name} name="name" required type="text" />
                    </label>

                    <label>
                      <span>Descriere</span>
                      <textarea defaultValue={service.description ?? ""} name="description" rows={3} />
                    </label>

                    <div className={styles.formRow}>
                      <label>
                        <span>Pret RON</span>
                        <input defaultValue={priceInputValue(service.priceCents)} min="0" name="price" required step="1" type="number" />
                      </label>

                      <label>
                        <span>Ordine</span>
                        <input defaultValue={service.sortOrder} name="sortOrder" step="1" type="number" />
                      </label>
                    </div>

                    <div className={styles.formRow}>
                      <label>
                        <span>Reducere %</span>
                        <input defaultValue={service.discountPercent} max="100" min="0" name="discountPercent" step="1" type="number" />
                      </label>

                      <label>
                        <span>De la</span>
                        <input defaultValue={dateInputValue(service.discountStartsAt)} name="discountStartsAt" type="date" />
                      </label>

                      <label>
                        <span>Pana la</span>
                        <input defaultValue={dateInputValue(service.discountEndsAt)} name="discountEndsAt" type="date" />
                      </label>
                    </div>

                    <label className={styles.checkRow}>
                      <input defaultChecked={service.isPaused} name="isPaused" type="checkbox" />
                      <span>Pauza temporara: nu afisa serviciul pe site</span>
                    </label>

                    <label className={styles.checkRow}>
                      <input defaultChecked={service.discountEnabled} name="discountEnabled" type="checkbox" />
                      <span>Publica reducerea pe site</span>
                    </label>

                    <div className={styles.actionRow}>
                      <button className={styles.saveButton} type="submit">Salveaza</button>
                    </div>
                  </form>

                  <form action={deleteMedicalService}>
                    <input name="serviceId" type="hidden" value={service.id} />
                    <button className={styles.dangerButton} type="submit">Sterge serviciu</button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
