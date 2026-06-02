import { prisma } from "@/lib/prisma";

export type AdminAppointment = {
  id: string;
  date: string;
  day: string;
  time: string;
  durationMin: number;
  childName: string;
  parentName: string;
  service: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: string;
};

export type OccupiedAppointmentSlot = {
  date: string;
  time: string;
};

type AppointmentRow = {
  id: string;
  date: Date;
  time: string;
  durationMin: number;
  childName: string;
  parentName: string;
  service: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
};

const statusLabels = {
  CANCELLED: "Cancelata",
  COMPLETED: "Finalizata",
  CONFIRMED: "Confirmata",
  NEW: "Noua",
} satisfies Record<AppointmentRow["status"], string>;

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    timeZone: "UTC",
    weekday: "long",
  }).format(date);

  return formatted.replace(/^(\p{L})/u, (letter) => letter.toLocaleUpperCase("ro-RO"));
}

export async function getAdminAppointments() {
  const rows = await prisma.$queryRaw<AppointmentRow[]>`
    SELECT
      "id",
      "date",
      "time",
      "durationMin",
      "childName",
      "parentName",
      "service",
      "phone",
      "email",
      "notes",
      "status"
    FROM "Appointment"
    ORDER BY "date" ASC, "time" ASC
  `;

  return rows.map((row) => ({
    ...row,
    date: dateKey(row.date),
    day: dayLabel(row.date),
    status: statusLabels[row.status],
  }));
}

export async function getOccupiedAppointmentSlots() {
  const rows = await prisma.$queryRaw<Array<{ date: Date; time: string }>>`
    SELECT "date", "time"
    FROM "Appointment"
    WHERE "status" <> 'CANCELLED'
    ORDER BY "date" ASC, "time" ASC
  `;

  return rows.map((row) => ({
    date: dateKey(row.date),
    time: row.time,
  }));
}
