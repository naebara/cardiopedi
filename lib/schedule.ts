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
  reason: string | null;
  createdAt: Date;
  createdBy: string | null;
};

export type PublicBlockedDate = {
  id: string;
  date: string;
  dateLabel: string;
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

  return formatted.replaceAll(/\p{L}+/gu, (word) => {
    return word.charAt(0).toLocaleUpperCase("ro-RO") + word.slice(1);
  });
}

function blockedDateWithDisplay(row: ClinicBlockedDate): PublicBlockedDate {
  const date = dateKey(row.date);

  return {
    date,
    dateLabel: formatScheduleDate(date),
    id: row.id,
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
    SELECT "id", "date", "reason", "createdAt", "createdBy"
    FROM "ClinicBlockedDate"
    WHERE "date" >= CURRENT_DATE
    ORDER BY "date" ASC
  `;

  return rows.map(blockedDateWithDisplay);
}

export async function getPublicBlockedDates() {
  const rows = await prisma.$queryRaw<ClinicBlockedDate[]>`
    SELECT "id", "date", "reason", "createdAt", "createdBy"
    FROM "ClinicBlockedDate"
    WHERE "date" >= CURRENT_DATE
    ORDER BY "date" ASC
  `;

  return rows.map(blockedDateWithDisplay);
}

export async function getActiveAppointmentCountsByDate() {
  const rows = await prisma.$queryRaw<Array<{ count: bigint; date: Date }>>`
    SELECT "date", COUNT(*) AS "count"
    FROM "Appointment"
    WHERE "status" <> 'CANCELLED'
      AND "date" >= CURRENT_DATE
    GROUP BY "date"
    ORDER BY "date" ASC
  `;

  return rows.map((row) => ({
    count: Number(row.count),
    date: dateKey(row.date),
  })) satisfies AppointmentCountByDate[];
}
