"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Clock,
  Edit3,
  PauseCircle,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { createScheduleSlot, deleteScheduleSlot, updateScheduleSlot } from "@/app/admin/actions";
import styles from "./schedule.module.css";

type DayOption = {
  value: number;
  label: string;
};

export type ScheduleSlotRow = {
  id: string;
  dayOfWeek: number;
  dayLabel: string;
  startTime: string;
  endTime: string;
  interval: string;
  durationMin: number;
  isPaused: boolean;
  sortOrder: number;
};

type ScheduleSettingsTableProps = {
  dayOptions: DayOption[];
  slots: ScheduleSlotRow[];
};

type ActiveModal =
  | { type: "create"; defaultDay?: number }
  | { type: "edit"; slot: ScheduleSlotRow }
  | { type: "delete"; slot: ScheduleSlotRow }
  | null;

const dayShortLabels: Record<number, string> = {
  0: "Du",
  1: "Lu",
  2: "Ma",
  3: "Mi",
  4: "Jo",
  5: "Vi",
  6: "Sa",
};

function timeToMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function hasValidScheduleTimes(formData: FormData) {
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  return Boolean(startTime && endTime && startTime < endTime);
}

function ScheduleFields({
  dayOptions,
  slot,
  defaultDay,
}: {
  dayOptions: DayOption[];
  slot?: ScheduleSlotRow;
  defaultDay?: number;
}) {
  const [dayOfWeek, setDayOfWeek] = useState(slot?.dayOfWeek ?? defaultDay ?? 1);
  const [startTime, setStartTime] = useState(slot?.startTime ?? "");
  const [endTime, setEndTime] = useState(slot?.endTime ?? "");
  const [durationMin, setDurationMin] = useState(String(slot?.durationMin ?? 30));

  const dayLabel = dayOptions.find((day) => day.value === dayOfWeek)?.label ?? "";

  const preview = useMemo(() => {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const duration = Number(durationMin);

    if (start === null || end === null || end <= start || !Number.isFinite(duration) || duration <= 0) {
      return null;
    }

    return {
      count: Math.floor((end - start) / duration),
      duration,
    };
  }, [startTime, endTime, durationMin]);

  return (
    <>
      <input name="dayOfWeek" type="hidden" value={dayOfWeek} />

      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <CalendarDays size={14} /> Ziua din saptamana
        </span>
        <div className={styles.dayPills} role="group" aria-label="Alege ziua">
          {dayOptions.map((day) => {
            const active = day.value === dayOfWeek;

            return (
              <button
                aria-pressed={active}
                className={`${styles.dayPill} ${active ? styles.dayPillActive : ""}`}
                key={day.value}
                onClick={() => setDayOfWeek(day.value)}
                title={day.label}
                type="button"
              >
                {dayShortLabels[day.value] ?? day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <Clock size={14} /> Interval orar
        </span>
        <div className={styles.fieldGrid2}>
          <label className={styles.field}>
            <span>Ora inceput</span>
            <input
              className={styles.input}
              name="startTime"
              onChange={(event) => setStartTime(event.target.value)}
              required
              type="time"
              value={startTime}
            />
          </label>

          <label className={styles.field}>
            <span>Ora sfarsit</span>
            <input
              className={styles.input}
              name="endTime"
              onChange={(event) => setEndTime(event.target.value)}
              required
              type="time"
              value={endTime}
            />
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <Timer size={14} /> Configurare slot
        </span>
        <div className={styles.fieldGrid3}>
          <label className={styles.field}>
            <span>Durata slot (minute)</span>
            <input
              className={styles.input}
              min="1"
              name="durationMin"
              onChange={(event) => setDurationMin(event.target.value)}
              required
              step="1"
              type="number"
              value={durationMin}
            />
          </label>

          <label className={styles.field}>
            <span>Ordine afisare</span>
            <input className={styles.input} defaultValue={slot?.sortOrder ?? 0} name="sortOrder" step="1" type="number" />
          </label>
        </div>
      </div>

      <div className={styles.preview} aria-live="polite">
        <span className={styles.previewIcon}>
          <CalendarClock size={20} />
        </span>
        <div className={styles.previewText}>
          <span className={styles.previewTitle}>
            {dayLabel}
            {startTime && endTime ? ` · ${startTime}–${endTime}` : ""}
          </span>
          {preview ? (
            <span className={styles.previewSub}>
              Sloturi de {preview.duration} min · genereaza aproximativ <b>{preview.count} programari</b>
            </span>
          ) : (
            <span className={`${styles.previewSub} ${styles.previewMuted}`}>
              Completeaza orele pentru a vedea numarul de programari.
            </span>
          )}
        </div>
      </div>

      <label className={styles.toggle}>
        <input className={styles.toggleInput} defaultChecked={slot?.isPaused ?? false} name="isPaused" type="checkbox" />
        <span className={styles.toggleTrack} aria-hidden="true" />
        <span className={styles.toggleText}>
          <strong>Pune intervalul in pauza</strong>
          <span>Ramane salvat, dar nu apare pe site pentru programari.</span>
        </span>
      </label>
    </>
  );
}

function ModalSubmitButton({ idleLabel }: { idleLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={styles.btnPrimary} disabled={pending} type="submit">
      {pending ? "Se salveaza..." : idleLabel}
    </button>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={styles.btnDanger} disabled={pending} type="submit">
      {pending ? "Se sterge..." : "Sterge interval"}
    </button>
  );
}

export function ScheduleSettingsTable({ dayOptions, slots }: ScheduleSettingsTableProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [validationError, setValidationError] = useState("");

  const activeCount = useMemo(() => slots.filter((slot) => !slot.isPaused).length, [slots]);
  const pausedCount = slots.length - activeCount;

  const orderedSlots = useMemo(() => {
    const dayRank = new Map(dayOptions.map((day, index) => [day.value, index]));

    return [...slots].sort((a, b) => {
      const rankA = dayRank.get(a.dayOfWeek) ?? a.dayOfWeek;
      const rankB = dayRank.get(b.dayOfWeek) ?? b.dayOfWeek;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      return a.startTime.localeCompare(b.startTime);
    });
  }, [slots, dayOptions]);

  function closeModal() {
    setValidationError("");
    setActiveModal(null);
  }

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  async function handleCreate(formData: FormData) {
    if (!hasValidScheduleTimes(formData)) {
      setValidationError("Ora de sfarsit trebuie sa fie dupa ora de inceput.");
      return;
    }

    setValidationError("");
    await createScheduleSlot(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!hasValidScheduleTimes(formData)) {
      setValidationError("Ora de sfarsit trebuie sa fie dupa ora de inceput.");
      return;
    }

    setValidationError("");
    await updateScheduleSlot(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteScheduleSlot(formData);
    setValidationError("");
    setActiveModal(null);
    router.refresh();
  }

  const modalTitle =
    activeModal?.type === "create"
      ? "Adauga interval"
      : activeModal?.type === "edit"
        ? "Editeaza interval"
        : "Sterge interval";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Program cabinet</span>
          <h1>Intervale de programare</h1>
          <p>Organizeaza saptamana pe zile si controleaza ce intervale sunt disponibile pentru pacienti pe site.</p>
        </div>
        <button
          className={styles.addButton}
          onClick={() => {
            setValidationError("");
            setActiveModal({ type: "create" });
          }}
          type="button"
        >
          <Plus size={18} />
          Adauga interval
        </button>
      </header>

      <section className={styles.panel}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={`${styles.statIcon} ${styles.statIconTotal}`}>
              <CalendarRange size={20} />
            </span>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{slots.length}</span>
              <span className={styles.statLabel}>Intervale totale</span>
            </div>
          </div>

          <div className={styles.stat}>
            <span className={`${styles.statIcon} ${styles.statIconLive}`}>
              <CalendarClock size={20} />
            </span>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{activeCount}</span>
              <span className={styles.statLabel}>Afisate pe site</span>
            </div>
          </div>

          <div className={styles.stat}>
            <span className={`${styles.statIcon} ${styles.statIconPaused}`}>
              <PauseCircle size={20} />
            </span>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{pausedCount}</span>
              <span className={styles.statLabel}>In pauza</span>
            </div>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyArt}>
              <CalendarDays size={30} />
            </span>
            <h3>Inca nu ai adaugat intervale</h3>
            <p>Adauga primul interval pentru ca pacientii sa poata alege o ora disponibila la cabinet.</p>
            <button
              className={styles.addButton}
              onClick={() => {
                setValidationError("");
                setActiveModal({ type: "create" });
              }}
              type="button"
            >
              <Plus size={18} />
              Adauga primul interval
            </button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Zi</th>
                  <th>Interval</th>
                  <th>Durata slot</th>
                  <th>Ordine</th>
                  <th>Status</th>
                  <th>Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {orderedSlots.map((slot, index) => (
                  <Fragment key={slot.id}>
                    {index > 0 ? (
                      <tr className={styles.spacer} aria-hidden="true">
                        <td colSpan={6} />
                      </tr>
                    ) : null}
                    <tr className={`${styles.row} ${slot.isPaused ? styles.rowPaused : ""}`}>
                      <td>
                        <div className={styles.cellDay}>
                          <span className={`${styles.dayBadge} ${slot.isPaused ? styles.dayBadgeMuted : ""}`}>
                            {dayShortLabels[slot.dayOfWeek] ?? slot.dayLabel.slice(0, 2)}
                          </span>
                          <span className={styles.cellDayName}>{slot.dayLabel}</span>
                        </div>
                      </td>
                      <td data-label="Interval">
                        <span className={styles.cellInterval}>
                          <Clock size={15} />
                          {slot.startTime}–{slot.endTime}
                        </span>
                      </td>
                      <td data-label="Durata slot">
                        <span className={styles.cellMuted}>{slot.durationMin} min</span>
                      </td>
                      <td data-label="Ordine">
                        <span className={styles.cellMuted}>{slot.sortOrder}</span>
                      </td>
                      <td data-label="Status">
                        <span className={`${styles.statusDot} ${slot.isPaused ? styles.statusPaused : styles.statusLive}`}>
                          {slot.isPaused ? "In pauza" : "Afisat"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            aria-label={`Editeaza intervalul ${slot.dayLabel} ${slot.interval}`}
                            className={styles.slotBtn}
                            onClick={() => {
                              setValidationError("");
                              setActiveModal({ type: "edit", slot });
                            }}
                            title="Editeaza"
                            type="button"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            aria-label={`Sterge intervalul ${slot.dayLabel} ${slot.interval}`}
                            className={`${styles.slotBtn} ${styles.slotBtnDanger}`}
                            onClick={() => {
                              setValidationError("");
                              setActiveModal({ type: "delete", slot });
                            }}
                            title="Sterge"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeModal ? (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
          role="presentation"
        >
          <div aria-labelledby="schedule-modal-title" aria-modal="true" className={styles.modal} role="dialog">
            <div className={styles.modalHead}>
              <span className={`${styles.modalHeadIcon} ${activeModal.type === "delete" ? styles.modalHeadDanger : ""}`}>
                {activeModal.type === "create" ? (
                  <Sparkles size={22} />
                ) : activeModal.type === "edit" ? (
                  <Edit3 size={20} />
                ) : (
                  <Trash2 size={20} />
                )}
              </span>
              <div className={styles.modalHeadText}>
                <h2 id="schedule-modal-title">{modalTitle}</h2>
                <p>
                  {activeModal.type === "create"
                    ? "Alege ziua, intervalul orar si durata fiecarui slot."
                    : `${activeModal.slot.dayLabel} · ${activeModal.slot.interval}`}
                </p>
              </div>
              <button aria-label="Inchide" className={styles.closeBtn} onClick={closeModal} type="button">
                <X size={18} />
              </button>
            </div>

            {activeModal.type === "delete" ? (
              <form action={handleDelete}>
                <div className={styles.form}>
                  <input name="slotId" type="hidden" value={activeModal.slot.id} />
                  <div className={styles.confirm}>
                    <strong>Confirmi stergerea acestui interval?</strong>
                    <span>Actiunea elimina intervalul din program si nu poate fi anulata din acest ecran.</span>
                    <div className={styles.confirmSlot}>
                      <Clock size={16} color="#b83b35" />
                      <div>
                        <strong>{activeModal.slot.interval}</strong> <span>· {activeModal.slot.dayLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.footer}>
                  <button className={styles.btnGhost} onClick={closeModal} type="button">
                    Renunta
                  </button>
                  <DeleteSubmitButton />
                </div>
              </form>
            ) : (
              <form
                action={activeModal.type === "create" ? handleCreate : handleUpdate}
                onChange={() => setValidationError("")}
              >
                <div className={styles.form}>
                  {activeModal.type === "edit" ? (
                    <input name="slotId" type="hidden" value={activeModal.slot.id} />
                  ) : null}
                  <ScheduleFields
                    dayOptions={dayOptions}
                    defaultDay={activeModal.type === "create" ? activeModal.defaultDay : undefined}
                    slot={activeModal.type === "edit" ? activeModal.slot : undefined}
                  />
                  {validationError ? (
                    <p className={styles.error} role="alert">
                      <AlertTriangle size={16} />
                      {validationError}
                    </p>
                  ) : null}
                </div>
                <div className={styles.footer}>
                  <button className={styles.btnGhost} onClick={closeModal} type="button">
                    Renunta
                  </button>
                  <ModalSubmitButton idleLabel={activeModal.type === "create" ? "Adauga interval" : "Salveaza modificarile"} />
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
