"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgePercent,
  CalendarRange,
  CircleDollarSign,
  Edit3,
  Eye,
  HeartPulse,
  ListOrdered,
  PauseCircle,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { createMedicalService, deleteMedicalService, updateMedicalService } from "@/app/admin/actions";
import styles from "./services.module.css";

export type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  priceRon: string;
  priceCents: number;
  currency: string;
  displayPrice: string;
  displayDiscountedPrice: string | null;
  hasActiveDiscount: boolean;
  discountEnabled: boolean;
  discountPercent: number;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
  isPaused: boolean;
  sortOrder: number;
};

type ServicesManagerProps = {
  services: ServiceRow[];
};

type ActiveModal =
  | { type: "create" }
  | { type: "edit"; service: ServiceRow }
  | { type: "delete"; service: ServiceRow }
  | null;

const ronFormatter = new Intl.NumberFormat("ro-RO", {
  currency: "RON",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
}

function ServiceFields({ service }: { service?: ServiceRow }) {
  const [price, setPrice] = useState(service?.priceRon ?? "");
  const [discountPercent, setDiscountPercent] = useState(String(service?.discountPercent ?? 0));
  const [discountEnabled, setDiscountEnabled] = useState(service?.discountEnabled ?? false);

  const preview = useMemo(() => {
    const priceValue = Number(price);

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      return null;
    }

    const percent = Number(discountPercent);
    const showsDiscount = discountEnabled && Number.isFinite(percent) && percent > 0;
    const finalValue = showsDiscount ? Math.max(0, Math.round((priceValue * (100 - percent)) / 100)) : priceValue;

    return {
      final: ronFormatter.format(finalValue),
      original: ronFormatter.format(priceValue),
      percent,
      showsDiscount,
    };
  }, [price, discountPercent, discountEnabled]);

  return (
    <>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <HeartPulse size={14} /> Detalii serviciu
        </span>
        <label className={styles.field}>
          <span>Nume serviciu</span>
          <input className={styles.input} defaultValue={service?.name ?? ""} name="name" required type="text" />
        </label>
        <label className={styles.field}>
          <span>Descriere</span>
          <textarea className={styles.input} defaultValue={service?.description ?? ""} name="description" rows={3} />
        </label>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <CircleDollarSign size={14} /> Pret si ordine
        </span>
        <div className={styles.fieldGrid2}>
          <label className={styles.field}>
            <span>Pret (RON)</span>
            <input
              className={styles.input}
              min="0"
              name="price"
              onChange={(event) => setPrice(event.target.value)}
              required
              step="1"
              type="number"
              value={price}
            />
          </label>
          <label className={styles.field}>
            <span>Ordine afisare</span>
            <input className={styles.input} defaultValue={service?.sortOrder ?? 0} name="sortOrder" step="1" type="number" />
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <BadgePercent size={14} /> Reducere
        </span>
        <div className={styles.fieldGrid3}>
          <label className={styles.field}>
            <span>Reducere %</span>
            <input
              className={styles.input}
              max="100"
              min="0"
              name="discountPercent"
              onChange={(event) => setDiscountPercent(event.target.value)}
              step="1"
              type="number"
              value={discountPercent}
            />
          </label>
          <label className={styles.field}>
            <span>De la</span>
            <input className={styles.input} defaultValue={service?.discountStartsAt ?? ""} name="discountStartsAt" type="date" />
          </label>
          <label className={styles.field}>
            <span>Pana la</span>
            <input className={styles.input} defaultValue={service?.discountEndsAt ?? ""} name="discountEndsAt" type="date" />
          </label>
        </div>
        <label className={styles.toggle}>
          <input
            checked={discountEnabled}
            className={styles.toggleInput}
            name="discountEnabled"
            onChange={(event) => setDiscountEnabled(event.target.checked)}
            type="checkbox"
          />
          <span className={styles.toggleTrack} aria-hidden="true" />
          <span className={styles.toggleText}>
            <strong>Publica reducerea pe site</strong>
            <span>Reducerea se aplica doar in intervalul de date setat mai sus.</span>
          </span>
        </label>
      </div>

      <div className={styles.preview} aria-live="polite">
        <span className={styles.previewIcon}>
          <Tag size={20} />
        </span>
        <div className={styles.previewText}>
          {preview ? (
            <>
              <span className={styles.previewTitle}>
                {preview.showsDiscount ? preview.final : preview.original}
                {preview.showsDiscount ? <span className={styles.previewStrike}>{preview.original}</span> : null}
              </span>
              <span className={styles.previewSub}>
                {preview.showsDiscount
                  ? `Pret afisat pe site cu reducere de ${preview.percent}%`
                  : "Pret afisat pe site"}
              </span>
            </>
          ) : (
            <>
              <span className={styles.previewTitle}>Pret serviciu</span>
              <span className={`${styles.previewSub} ${styles.previewMuted}`}>Completeaza pretul pentru previzualizare.</span>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>
          <Eye size={14} /> Vizibilitate
        </span>
        <label className={styles.toggle}>
          <input
            className={`${styles.toggleInput} ${styles.togglePause}`}
            defaultChecked={service?.isPaused ?? false}
            name="isPaused"
            type="checkbox"
          />
          <span className={styles.toggleTrack} aria-hidden="true" />
          <span className={styles.toggleText}>
            <strong>Pune serviciul in pauza</strong>
            <span>Ramane salvat, dar nu apare pe site pentru pacienti.</span>
          </span>
        </label>
      </div>
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
      {pending ? "Se sterge..." : "Sterge serviciu"}
    </button>
  );
}

export function ServicesManager({ services }: ServicesManagerProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [validationError, setValidationError] = useState("");

  const activeCount = useMemo(() => services.filter((service) => !service.isPaused).length, [services]);
  const pausedCount = services.length - activeCount;
  const discountCount = useMemo(() => services.filter((service) => service.hasActiveDiscount).length, [services]);

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
    if (!String(formData.get("name") ?? "").trim()) {
      setValidationError("Numele serviciului este obligatoriu.");
      return;
    }

    if (!(Number(formData.get("price")) > 0)) {
      setValidationError("Pretul trebuie sa fie mai mare ca zero.");
      return;
    }

    setValidationError("");
    await createMedicalService(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function handleUpdate(formData: FormData) {
    if (!String(formData.get("name") ?? "").trim()) {
      setValidationError("Numele serviciului este obligatoriu.");
      return;
    }

    if (!(Number(formData.get("price")) > 0)) {
      setValidationError("Pretul trebuie sa fie mai mare ca zero.");
      return;
    }

    setValidationError("");
    await updateMedicalService(formData);
    setActiveModal(null);
    router.refresh();
  }

  async function handleDelete(formData: FormData) {
    await deleteMedicalService(formData);
    setValidationError("");
    setActiveModal(null);
    router.refresh();
  }

  const modalTitle =
    activeModal?.type === "create"
      ? "Adauga serviciu"
      : activeModal?.type === "edit"
        ? "Editeaza serviciu"
        : "Sterge serviciu";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Setari clinica</span>
          <h1>Servicii &amp; tarife</h1>
          <p>Gestioneaza serviciile afisate pe site, preturile, pauzele si reducerile temporare dintr-un singur loc.</p>
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
          Adauga serviciu
        </button>
      </header>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={`${styles.statIcon} ${styles.statIconTotal}`}>
            <HeartPulse size={20} />
          </span>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{services.length}</span>
            <span className={styles.statLabel}>Servicii totale</span>
          </div>
        </div>

        <div className={styles.stat}>
          <span className={`${styles.statIcon} ${styles.statIconLive}`}>
            <Eye size={20} />
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

        <div className={styles.stat}>
          <span className={`${styles.statIcon} ${styles.statIconDiscount}`}>
            <BadgePercent size={20} />
          </span>
          <div className={styles.statBody}>
            <span className={styles.statValue}>{discountCount}</span>
            <span className={styles.statLabel}>Reduceri active</span>
          </div>
        </div>
      </div>

      {services.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyArt}>
            <HeartPulse size={30} />
          </span>
          <h3>Inca nu ai adaugat servicii</h3>
          <p>Adauga primul serviciu pentru ca pacientii sa vada oferta cabinetului si tarifele pe site.</p>
          <button
            className={styles.addButton}
            onClick={() => {
              setValidationError("");
              setActiveModal({ type: "create" });
            }}
            type="button"
          >
            <Plus size={18} />
            Adauga primul serviciu
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {services.map((service) => {
            const discountInactive = service.discountEnabled && service.discountPercent > 0 && !service.hasActiveDiscount;
            const startLabel = formatDate(service.discountStartsAt);
            const endLabel = formatDate(service.discountEndsAt);

            return (
              <article
                className={`${styles.serviceCard} ${service.isPaused ? styles.serviceCardPaused : ""}`}
                key={service.id}
              >
                <div className={styles.serviceBody}>
                  <div className={styles.serviceHead}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <span className={`${styles.statusDot} ${service.isPaused ? styles.statusPaused : styles.statusLive}`}>
                      {service.isPaused ? "In pauza" : "Afisat"}
                    </span>
                    {discountInactive ? (
                      <span className={`${styles.statusDot} ${styles.statusScheduled}`}>Reducere inactiva</span>
                    ) : null}
                  </div>

                  {service.description ? <p className={styles.serviceDesc}>{service.description}</p> : null}

                  <div className={styles.priceRow}>
                    {service.hasActiveDiscount && service.displayDiscountedPrice ? (
                      <>
                        <span className={styles.priceMain}>{service.displayDiscountedPrice}</span>
                        <span className={styles.priceOriginal}>{service.displayPrice}</span>
                        <span className={styles.discountBadge}>
                          <BadgePercent size={13} />-{service.discountPercent}%
                        </span>
                      </>
                    ) : (
                      <span className={styles.priceMain}>{service.displayPrice}</span>
                    )}
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <ListOrdered size={13} /> Ordine {service.sortOrder}
                    </span>
                    {service.discountPercent > 0 && (startLabel || endLabel) ? (
                      <span className={styles.metaItem}>
                        <CalendarRange size={13} />
                        {startLabel ?? "..."} – {endLabel ?? "..."}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className={styles.serviceSide}>
                  <div className={styles.serviceActions}>
                    <button
                      aria-label={`Editeaza serviciul ${service.name}`}
                      className={styles.iconBtn}
                      onClick={() => {
                        setValidationError("");
                        setActiveModal({ type: "edit", service });
                      }}
                      title="Editeaza"
                      type="button"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      aria-label={`Sterge serviciul ${service.name}`}
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => {
                        setValidationError("");
                        setActiveModal({ type: "delete", service });
                      }}
                      title="Sterge"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
          <div aria-labelledby="service-modal-title" aria-modal="true" className={styles.modal} role="dialog">
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
                <h2 id="service-modal-title">{modalTitle}</h2>
                <p>
                  {activeModal.type === "create"
                    ? "Completeaza detaliile serviciului afisat pe site."
                    : `${activeModal.service.name} · ${activeModal.service.displayPrice}`}
                </p>
              </div>
              <button aria-label="Inchide" className={styles.closeBtn} onClick={closeModal} type="button">
                <X size={18} />
              </button>
            </div>

            {activeModal.type === "delete" ? (
              <form action={handleDelete} className={styles.modalForm}>
                <div className={styles.form}>
                  <input name="serviceId" type="hidden" value={activeModal.service.id} />
                  <div className={styles.confirm}>
                    <strong>Confirmi stergerea acestui serviciu?</strong>
                    <span>Serviciul va fi eliminat de pe site si din lista de tarife. Actiunea nu poate fi anulata.</span>
                    <div className={styles.confirmService}>
                      <strong>{activeModal.service.name}</strong>
                      <span>{activeModal.service.displayPrice}</span>
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
                className={styles.modalForm}
                onChange={() => setValidationError("")}
              >
                <div className={styles.form}>
                  {activeModal.type === "edit" ? (
                    <input name="serviceId" type="hidden" value={activeModal.service.id} />
                  ) : null}
                  <ServiceFields service={activeModal.type === "edit" ? activeModal.service : undefined} />
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
                  <ModalSubmitButton idleLabel={activeModal.type === "create" ? "Adauga serviciu" : "Salveaza modificarile"} />
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
