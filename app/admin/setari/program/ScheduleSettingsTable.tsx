"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  Clock,
  Edit3,
  PauseCircle,
  Plus,
  Sparkles,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { blockScheduleDate, createScheduleSlot, deleteBlockedScheduleDate, deleteScheduleSlot, updateScheduleSlot } from "@/app/admin/actions";
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

export type BlockedDateRow = {
  id: string;
  date: string;
  endDate: string;
  dateLabel: string;
  endDateLabel: string;
  intervalLabel: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

type ScheduleSettingsTableProps = {
  appointmentSlotsForBlocking: Array<{ date: string; time: string }>;
  blockedDates: BlockedDateRow[];
  dayOptions: DayOption[];
  slots: ScheduleSlotRow[];
};

type ActiveModal =
  | { type: "create"; defaultDay?: number }
  | { type: "edit"; slot: ScheduleSlotRow }
  | { type: "delete"; slot: ScheduleSlotRow }
  | { type: "block-date" }
  | { type: "delete-blocked-date"; blockedDate: BlockedDateRow }
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

function weekdayFromDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return new Date(`${value}T12:00:00.000Z`).getUTCDay();
}

function nextDateValue(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function dateRangeIncludesWorkingDay(startDate: string, endDate: string, activeScheduleDays: Set<number>) {
  if (!startDate || !endDate || endDate < startDate) {
    return false;
  }

  for (let date = startDate; date <= endDate; date = nextDateValue(date)) {
    const weekday = weekdayFromDateValue(date);
    if (weekday !== null && activeScheduleDays.has(weekday)) {
      return true;
    }
  }

  return false;
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

function DeleteSubmitButton({ idleLabel = "Sterge interval" }: { idleLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={styles.btnDanger} disabled={pending} type="submit">
      {pending ? "Se sterge..." : idleLabel}
    </button>
  );
}

function BlockDateSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button aria-busy={pending} className={styles.btnPrimary} disabled={pending} type="submit">
      {pending ? "Se salveaza..." : "Planifica timp liber"}
    </button>
  );
}

export function ScheduleSettingsTable({ appointmentSlotsForBlocking, blockedDates, dayOptions, slots }: ScheduleSettingsTableProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedBlockDate, setSelectedBlockDate] = useState("");
  const [selectedBlockEndDate, setSelectedBlockEndDate] = useState("");
  const [isRangeBlock, setIsRangeBlock] = useState(false);
  const [isPartialDayBlock, setIsPartialDayBlock] = useState(false);
  const [selectedBlockStartTime, setSelectedBlockStartTime] = useState("");
  const [selectedBlockEndTime, setSelectedBlockEndTime] = useState("");
  const [validationError, setValidationError] = useState("");
  const activeScheduleDays = useMemo(() => new Set(slots.filter((slot) => !slot.isPaused).map((slot) => slot.dayOfWeek)), [slots]);
  const selectedBlockDateWeekday = weekdayFromDateValue(selectedBlockDate);
  const effectiveEndDate = isRangeBlock ? selectedBlockEndDate : selectedBlockDate;
  const selectedBlockDateAppointmentCount = appointmentSlotsForBlocking.filter((appointment) => {
    if (!selectedBlockDate || !effectiveEndDate || appointment.date < selectedBlockDate || appointment.date > effectiveEndDate) {
      return false;
    }

    if (isPartialDayBlock && !isRangeBlock && selectedBlockStartTime && selectedBlockEndTime) {
      return appointment.time >= selectedBlockStartTime && appointment.time < selectedBlockEndTime;
    }

    return true;
  }).length;
  const isSelectedBlockDateOutsideSchedule = isRangeBlock
    ? Boolean(selectedBlockDate && selectedBlockEndDate && !dateRangeIncludesWorkingDay(selectedBlockDate, selectedBlockEndDate, activeScheduleDays))
    : Boolean(selectedBlockDate && selectedBlockDateWeekday !== null && !activeScheduleDays.has(selectedBlockDateWeekday));

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
    setSelectedBlockDate("");
    setSelectedBlockEndDate("");
    setIsRangeBlock(false);
    setIsPartialDayBlock(false);
    setSelectedBlockStartTime("");
    setSelectedBlockEndTime("");
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
    setSelectedBlockDate("");
    setActiveModal(null);
    router.refresh();
  }

  async function handleBlockDate(formData: FormData) {
    const date = String(formData.get("date") ?? "");
    const endDate = String(formData.get("endDate") ?? date);
    const dayOfWeek = weekdayFromDateValue(date);

    if (isRangeBlock) {
      if (!dateRangeIncludesWorkingDay(date, endDate, activeScheduleDays)) {
        setValidationError("Intervalul selectat nu include nicio zi din programul de lucru al cabinetului.");
        return;
      }
    } else if (dayOfWeek === null || !activeScheduleDays.has(dayOfWeek)) {
      setValidationError("Ziua selectata oricum nu este in programul de lucru al cabinetului.");
      return;
    }

    if (!isRangeBlock && isPartialDayBlock && (!selectedBlockStartTime || !selectedBlockEndTime || selectedBlockStartTime >= selectedBlockEndTime)) {
      setValidationError("Alege un interval orar valid pentru timpul liber partial.");
      return;
    }

    const result = await blockScheduleDate({ message: "", status: "idle" }, formData);
    if (result.status === "error") {
      setValidationError(result.message);
      return;
    }

    setValidationError("");
    setSelectedBlockDate("");
    setActiveModal(null);
    router.refresh();
  }

  async function handleDeleteBlockedDate(formData: FormData) {
    await deleteBlockedScheduleDate(formData);
    setValidationError("");
    setActiveModal(null);
    router.refresh();
  }

  const modalTitle =
    activeModal?.type === "create"
      ? "Adauga interval"
      : activeModal?.type === "edit"
        ? "Editeaza interval"
        : activeModal?.type === "block-date"
          ? "Planifica timp liber"
          : activeModal?.type === "delete-blocked-date"
            ? "Deblocheaza zi"
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
            setSelectedBlockDate("");
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
                setSelectedBlockDate("");
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

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2>Timp liber planificat</h2>
            <p>Zilele si intervalele planificate aici nu mai apar pe site pentru programari noi.</p>
          </div>
          <button
            className={styles.addButton}
            onClick={() => {
              setValidationError("");
              setSelectedBlockDate("");
              setSelectedBlockEndDate("");
              setIsRangeBlock(false);
              setIsPartialDayBlock(false);
              setSelectedBlockStartTime("");
              setSelectedBlockEndTime("");
              setActiveModal({ type: "block-date" });
            }}
            type="button"
          >
            <CalendarX2 size={18} />
            Planifica timp liber
          </button>
        </div>

        {blockedDates.length === 0 ? (
          <div className={styles.compactEmpty}>
            <CalendarX2 size={24} />
            <span>Nu exista timp liber planificat in perioada urmatoare.</span>
          </div>
        ) : (
          <div className={styles.blockedGrid}>
            {blockedDates.map((blockedDate) => (
              <div className={styles.blockedItem} key={blockedDate.id}>
                <div className={styles.blockedIcon}>
                  <CalendarX2 size={18} />
                </div>
                <div className={styles.blockedText}>
                  <strong>
                    {blockedDate.date !== blockedDate.endDate
                      ? `${blockedDate.dateLabel} - ${blockedDate.endDateLabel}`
                      : blockedDate.dateLabel}
                  </strong>
                  <span>
                    {blockedDate.date !== blockedDate.endDate
                      ? blockedDate.reason || "Fara motiv adaugat"
                      : `${blockedDate.intervalLabel} · ${blockedDate.reason || "Fara motiv adaugat"}`}
                  </span>
                </div>
                <button
                  aria-label={`Deblocheaza ${blockedDate.dateLabel}`}
                  className={`${styles.slotBtn} ${styles.slotBtnDanger}`}
                  onClick={() => {
                    setValidationError("");
              setActiveModal({ type: "delete-blocked-date", blockedDate });
                  }}
                  title="Deblocheaza"
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
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
                ) : activeModal.type === "block-date" ? (
                  <CalendarX2 size={20} />
                ) : (
                  <Trash2 size={20} />
                )}
              </span>
              <div className={styles.modalHeadText}>
                <h2 id="schedule-modal-title">{modalTitle}</h2>
                <p>
                  {activeModal.type === "create"
                    ? "Alege ziua, intervalul orar si durata fiecarui slot."
                    : activeModal.type === "edit" || activeModal.type === "delete"
                      ? `${activeModal.slot.dayLabel} · ${activeModal.slot.interval}`
                    : activeModal.type === "delete-blocked-date"
                      ? activeModal.blockedDate.dateLabel
                      : "Alege perioada, intervalul si motivul."}
                </p>
              </div>
              <button aria-label="Inchide" className={styles.closeBtn} onClick={closeModal} type="button">
                <X size={18} />
              </button>
            </div>

            {activeModal.type === "delete" ? (
              <form action={handleDelete} className={styles.modalForm}>
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
            ) : activeModal.type === "delete-blocked-date" ? (
              <form action={handleDeleteBlockedDate} className={styles.modalForm}>
                <div className={styles.form}>
                  <input name="blockedDateId" type="hidden" value={activeModal.blockedDate.id} />
                  <div className={styles.confirm}>
                    <strong>Confirmi eliminarea acestui timp liber?</strong>
                    <span>Ziua va redeveni disponibila pentru programari daca exista intervale active in programul saptamanal.</span>
                    <div className={styles.confirmSlot}>
                      <CalendarX2 size={16} color="#b83b35" />
                      <div>
                        <strong>{activeModal.blockedDate.dateLabel}</strong>
                        {activeModal.blockedDate.reason ? <span> · {activeModal.blockedDate.reason}</span> : null}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={styles.footer}>
                  <button className={styles.btnGhost} onClick={closeModal} type="button">
                    Renunta
                  </button>
                  <DeleteSubmitButton idleLabel="Deblocheaza ziua" />
                </div>
              </form>
            ) : activeModal.type === "block-date" ? (
              <form action={handleBlockDate} className={styles.modalForm} onChange={() => setValidationError("")}>
                <div className={styles.form}>
                  <div className={styles.section}>
                    <span className={styles.sectionLabel}>
                      <CalendarX2 size={14} /> Timp liber
                    </span>
                    <div className={styles.segmentedControl} role="group" aria-label="Tip timp liber">
                      <button
                        aria-pressed={!isRangeBlock}
                        className={!isRangeBlock ? styles.segmentActive : ""}
                        onClick={() => {
                          setIsRangeBlock(false);
                          setSelectedBlockEndDate("");
                        }}
                        type="button"
                      >
                        O zi
                      </button>
                      <button
                        aria-pressed={isRangeBlock}
                        className={isRangeBlock ? styles.segmentActive : ""}
                        onClick={() => {
                          setIsRangeBlock(true);
                          setIsPartialDayBlock(false);
                          setSelectedBlockStartTime("");
                          setSelectedBlockEndTime("");
                          setSelectedBlockEndDate(selectedBlockDate);
                        }}
                        type="button"
                      >
                        Interval de date
                      </button>
                    </div>
                    <label className={styles.field}>
                      <span>{isRangeBlock ? "De la data" : "Data"}</span>
                      <input
                        className={styles.input}
                        min={new Date().toISOString().slice(0, 10)}
                        name="date"
                        onChange={(event) => {
                          setSelectedBlockDate(event.target.value);
                          if (isRangeBlock && (!selectedBlockEndDate || selectedBlockEndDate < event.target.value)) {
                            setSelectedBlockEndDate(event.target.value);
                          }
                        }}
                        required
                        type="date"
                        value={selectedBlockDate}
                      />
                    </label>
                    <input name="blockMode" type="hidden" value={isRangeBlock ? "range" : "single"} />
                    {isRangeBlock ? (
                      <label className={styles.field}>
                        <span>Pana la data</span>
                        <input
                          className={styles.input}
                          min={selectedBlockDate || new Date().toISOString().slice(0, 10)}
                          name="endDate"
                          onChange={(event) => setSelectedBlockEndDate(event.target.value)}
                          required
                          type="date"
                          value={selectedBlockEndDate}
                        />
                      </label>
                    ) : (
                      <input name="endDate" type="hidden" value={selectedBlockDate} />
                    )}
                    {!isRangeBlock ? (
                      <>
                        <label className={styles.toggle}>
                          <input
                            className={styles.toggleInput}
                            checked={isPartialDayBlock}
                            name="isPartialDay"
                            onChange={(event) => {
                              setIsPartialDayBlock(event.target.checked);
                              if (!event.target.checked) {
                                setSelectedBlockStartTime("");
                                setSelectedBlockEndTime("");
                              }
                            }}
                            type="checkbox"
                          />
                          <span className={styles.toggleTrack} aria-hidden="true" />
                          <span className={styles.toggleText}>
                            <strong>Planifica doar o parte din program</strong>
                            <span>Implicit se planifica toata ziua ca timp liber.</span>
                          </span>
                        </label>
                        {isPartialDayBlock ? (
                          <div className={styles.fieldGrid2}>
                            <label className={styles.field}>
                              <span>De la ora</span>
                              <input
                                className={styles.input}
                                name="startTime"
                                onChange={(event) => setSelectedBlockStartTime(event.target.value)}
                                required
                                type="time"
                                value={selectedBlockStartTime}
                              />
                            </label>
                            <label className={styles.field}>
                              <span>Pana la ora</span>
                              <input
                                className={styles.input}
                                name="endTime"
                                onChange={(event) => setSelectedBlockEndTime(event.target.value)}
                                required
                                type="time"
                                value={selectedBlockEndTime}
                              />
                            </label>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                    {selectedBlockDateAppointmentCount ? (
                      <div className={styles.appointmentWarning} role="alert">
                        <AlertTriangle size={18} />
                        <div>
                          <strong>
                            In {isRangeBlock ? "perioada selectata" : "aceasta zi"} {selectedBlockDateAppointmentCount === 1 ? "exista deja o programare" : `exista deja ${selectedBlockDateAppointmentCount} programari`}.
                          </strong>
                          <span>Dupa salvare, vei primi pe email detaliile de contact ca sa anunti pacientii si sa stabiliti reprogramarea.</span>
                        </div>
                      </div>
                    ) : null}
                    {isSelectedBlockDateOutsideSchedule ? (
                      <div className={styles.scheduleNotice} role="status">
                        <CalendarDays size={18} />
                        <div>
                          <strong>Ziua selectata nu este in programul de lucru al cabinetului.</strong>
                          <span>{isRangeBlock ? "Intervalul nu include zile in care pacientii pot face programari." : "Nu este nevoie sa planifici timp liber aici: pacientii oricum nu pot face programari in acea zi."}</span>
                        </div>
                      </div>
                    ) : null}
                    <label className={styles.field}>
                      <span>Motiv</span>
                      <textarea className={styles.textarea} name="reason" placeholder="Concediu, conferinta, alta indisponibilitate" rows={3} />
                    </label>
                  </div>
                  <div className={styles.preview} aria-live="polite">
                    <span className={styles.previewIcon}>
                      <AlertTriangle size={20} />
                    </span>
                    <div className={styles.previewText}>
                      <span className={styles.previewTitle}>Programarile noi vor fi oprite pentru aceasta zi.</span>
                      <span className={styles.previewSub}>Daca exista programari active, administratorii bifati pentru notificari vor primi email.</span>
                    </div>
                  </div>
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
                  <BlockDateSubmitButton />
                </div>
              </form>
            ) : (
              <form
                action={activeModal.type === "create" ? handleCreate : handleUpdate}
                className={styles.modalForm}
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
