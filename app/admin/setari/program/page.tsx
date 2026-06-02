import { createScheduleSlot, deleteScheduleSlot, updateScheduleSlot } from "@/app/admin/actions";
import { requireFeature } from "@/lib/admin-features";
import { getAdminScheduleSlots, scheduleDayOptions, scheduleSlotWithDisplay } from "@/lib/schedule";
import styles from "../../admin.module.css";

export default async function AdminScheduleSettingsPage() {
  await requireFeature("schedule.manage");
  const slots = await getAdminScheduleSlots();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>Program cabinet</h1>
          <p>Adauga intervalele disponibile pentru programari si ascunde temporar zilele indisponibile.</p>
        </div>
      </header>

      <section className={styles.panel}>
        <h2>Adauga interval</h2>
        <form action={createScheduleSlot} className={styles.serviceForm}>
          <div className={styles.formRow}>
            <label>
              <span>Zi</span>
              <select name="dayOfWeek" required>
                {scheduleDayOptions.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Ora inceput</span>
              <input name="startTime" required type="time" />
            </label>

            <label>
              <span>Ora sfarsit</span>
              <input name="endTime" required type="time" />
            </label>
          </div>

          <div className={styles.formRow}>
            <label>
              <span>Durata slot minute</span>
              <input defaultValue="30" min="1" name="durationMin" required step="1" type="number" />
            </label>

            <label>
              <span>Ordine</span>
              <input defaultValue="0" name="sortOrder" step="1" type="number" />
            </label>
          </div>

          <label className={styles.checkRow}>
            <input name="isPaused" type="checkbox" />
            <span>Pauza temporara: nu folosi intervalul pe site</span>
          </label>

          <button className={styles.saveButton} type="submit">Adauga interval</button>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.sectionTitle}>
          <h2>Intervale existente</h2>
          <span className={styles.badge}>{slots.length} intervale</span>
        </div>

        {slots.length === 0 ? (
          <p className={styles.muted}>Nu exista intervale adaugate.</p>
        ) : (
          <div className={styles.serviceAdminList}>
            {slots.map((slot) => {
              const displaySlot = scheduleSlotWithDisplay(slot);

              return (
                <article className={styles.serviceEditor} key={slot.id}>
                  <form action={updateScheduleSlot} className={styles.serviceForm}>
                    <input name="slotId" type="hidden" value={slot.id} />

                    <div className={styles.serviceEditorHeader}>
                      <div>
                        <h3>{displaySlot.dayLabel}</h3>
                        <p className={styles.muted}>
                          {displaySlot.interval}, sloturi de {slot.durationMin} min
                        </p>
                      </div>
                      <span className={slot.isPaused ? styles.statusPaused : styles.statusLive}>
                        {slot.isPaused ? "In pauza" : "Afisat"}
                      </span>
                    </div>

                    <div className={styles.formRow}>
                      <label>
                        <span>Zi</span>
                        <select defaultValue={slot.dayOfWeek} name="dayOfWeek" required>
                          {scheduleDayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>Ora inceput</span>
                        <input defaultValue={slot.startTime} name="startTime" required type="time" />
                      </label>

                      <label>
                        <span>Ora sfarsit</span>
                        <input defaultValue={slot.endTime} name="endTime" required type="time" />
                      </label>
                    </div>

                    <div className={styles.formRow}>
                      <label>
                        <span>Durata slot minute</span>
                        <input defaultValue={slot.durationMin} min="1" name="durationMin" required step="1" type="number" />
                      </label>

                      <label>
                        <span>Ordine</span>
                        <input defaultValue={slot.sortOrder} name="sortOrder" step="1" type="number" />
                      </label>
                    </div>

                    <label className={styles.checkRow}>
                      <input defaultChecked={slot.isPaused} name="isPaused" type="checkbox" />
                      <span>Pauza temporara: nu folosi intervalul pe site</span>
                    </label>

                    <div className={styles.actionRow}>
                      <button className={styles.saveButton} type="submit">Salveaza</button>
                    </div>
                  </form>

                  <form action={deleteScheduleSlot}>
                    <input name="slotId" type="hidden" value={slot.id} />
                    <button className={styles.dangerButton} type="submit">Sterge interval</button>
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
