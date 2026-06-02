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
