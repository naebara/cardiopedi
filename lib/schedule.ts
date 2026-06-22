import { prisma } from "@/lib/prisma";

export type ClinicScheduleSlot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMin: number;
  isPaused: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicScheduleSlot = ClinicScheduleSlot & {
  dayLabel: string;
  interval: string;
};

export type ClinicBlockedDate = {
  id: string;
  date: Date;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: Date;
  createdBy: string | null;
};

export type PublicBlockedDate = {
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

export type AppointmentCountByDate = {
  count: number;
  date: string;
};

const dayLabels = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];

export const scheduleDayOptions = [
  { value: 1, label: "Luni" },
  { value: 2, label: "Marti" },
  { value: 3, label: "Miercuri" },
  { value: 4, label: "Joi" },
  { value: 5, label: "Vineri" },
  { value: 6, label: "Sambata" },
  { value: 0, label: "Duminica" },
];

export function scheduleSlotWithDisplay(slot: ClinicScheduleSlot): PublicScheduleSlot {
  return {
    ...slot,
    dayLabel: dayLabels[slot.dayOfWeek] ?? "Zi necunoscuta",
    interval: `${slot.startTime} - ${slot.endTime}`,
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function formatScheduleDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(`${value}T12:00:00.000Z`) : value;
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return capitalizeDateLabel(formatted);
}

function capitalizeDateLabel(value: string) {
  let shouldCapitalize = true;

  return Array.from(value, (char) => {
    const isLetter = char.toLocaleLowerCase("ro-RO") !== char.toLocaleUpperCase("ro-RO");
    const next = shouldCapitalize && isLetter ? char.toLocaleUpperCase("ro-RO") : char;

    shouldCapitalize = char === "," || char === " " || char === "-";
    if (isLetter || /\d/.test(char)) {
      shouldCapitalize = false;
    }

    return next;
  }).join("");
}

function blockedDateWithDisplay(row: ClinicBlockedDate): PublicBlockedDate {
  const date = dateKey(row.date);
  const endDate = dateKey(row.endDate ?? row.date);
  const isRange = date !== endDate;
  const intervalLabel = row.startTime && row.endTime ? `${row.startTime} - ${row.endTime}` : "Toata ziua";

  return {
    date,
    endDate,
    dateLabel: formatScheduleDate(date),
    endDateLabel: formatScheduleDate(endDate),
    id: row.id,
    intervalLabel: isRange ? "Toata ziua" : intervalLabel,
    startTime: isRange ? null : row.startTime,
    endTime: isRange ? null : row.endTime,
    reason: row.reason,
  };
}

export async function getAdminScheduleSlots() {
  return prisma.$queryRaw<ClinicScheduleSlot[]>`
    SELECT
      "id",
      "dayOfWeek",
      "startTime",
      "endTime",
      "durationMin",
      "isPaused",
      "sortOrder",
      "createdAt",
      "updatedAt"
    FROM "ClinicScheduleSlot"
    ORDER BY "sortOrder" ASC, "dayOfWeek" ASC, "startTime" ASC
  `;
}

export async function getPublicScheduleSlots() {
  const slots = await prisma.$queryRaw<ClinicScheduleSlot[]>`
    SELECT
      "id",
      "dayOfWeek",
      "startTime",
      "endTime",
      "durationMin",
      "isPaused",
      "sortOrder",
      "createdAt",
      "updatedAt"
    FROM "ClinicScheduleSlot"
    WHERE "isPaused" = false
    ORDER BY "sortOrder" ASC, "dayOfWeek" ASC, "startTime" ASC
  `;

  return slots.map(scheduleSlotWithDisplay);
}

export async function getAdminBlockedDates() {
  const rows = await prisma.$queryRaw<ClinicBlockedDate[]>`
    SELECT "id", "date", "endDate", "startTime", "endTime", "reason", "createdAt", "createdBy"
    FROM "ClinicBlockedDate"
    WHERE COALESCE("endDate", "date") >= CURRENT_DATE
    ORDER BY "date" ASC
  `;

  return rows.map(blockedDateWithDisplay);
}

export async function getPublicBlockedDates() {
  const rows = await prisma.$queryRaw<ClinicBlockedDate[]>`
    SELECT "id", "date", "endDate", "startTime", "endTime", "reason", "createdAt", "createdBy"
    FROM "ClinicBlockedDate"
    WHERE COALESCE("endDate", "date") >= CURRENT_DATE
    ORDER BY "date" ASC
  `;

  return rows.map(blockedDateWithDisplay);
}

export async function getActiveAppointmentCountsByDate() {
  const rows = await prisma.$queryRaw<Array<{ date: Date; time: string }>>`
    SELECT "date", "time"
    FROM "Appointment"
    WHERE "status" <> 'CANCELLED'
      AND "date" >= CURRENT_DATE
    ORDER BY "date" ASC
  `;

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = dateKey(row.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts, ([date, count]) => ({ count, date })) satisfies AppointmentCountByDate[];
}

export async function getActiveAppointmentSlotsForBlocking() {
  const rows = await prisma.$queryRaw<Array<{ date: Date; time: string }>>`
    SELECT "date", "time"
    FROM "Appointment"
    WHERE "status" <> 'CANCELLED'
      AND "date" >= CURRENT_DATE
    ORDER BY "date" ASC, "time" ASC
  `;

  return rows.map((row) => ({
    date: dateKey(row.date),
    time: row.time,
  }));
}
