import { prisma } from "@/lib/prisma";

export type AdminAppointment = {
  id: string;
  date: string;
  day: string;
  time: string;
  durationMin: number;
  childName: string;
  childAge: string | null;
  parentName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: string;
};

export type OccupiedAppointmentSlot = {
  date: string;
  time: string;
};

export type AdminPatient = {
  appointmentId: string;
  childAge: string | null;
  childName: string;
  date: string;
  day: string;
  parentName: string;
  phone: string;
  status: string;
  time: string;
};

export type AdminPatientAppointment = AdminAppointment;

type AppointmentRow = {
  id: string;
  date: Date;
  time: string;
  durationMin: number;
  childName: string;
  childAge: string | null;
  parentName: string;
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

  return formatted.charAt(0).toLocaleUpperCase("ro-RO") + formatted.slice(1);
}

export async function getAdminAppointments() {
  const rows = await prisma.$queryRaw<AppointmentRow[]>`
    SELECT
      "id",
      "date",
      "time",
      "durationMin",
      "childName",
      "childAge",
      "parentName",
      "phone",
      "email",
      "notes",
      "status"
    FROM "Appointment"
    WHERE "status" <> 'CANCELLED'
      AND "deletedAt" IS NULL
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
      AND "deletedAt" IS NULL
    ORDER BY "date" ASC, "time" ASC
  `;

  return rows.map((row) => ({
    date: dateKey(row.date),
    time: row.time,
  }));
}

export async function getAdminPatients() {
  const rows = await prisma.$queryRaw<Array<{
    appointmentId: string;
    childName: string;
    childAge: string | null;
    date: Date;
    parentName: string;
    phone: string;
    status: AppointmentRow["status"];
    time: string;
  }>>`
    SELECT
      a."id" AS "appointmentId",
      a."childName",
      a."childAge",
      a."date",
      a."parentName",
      a."phone",
      a."status",
      a."time"
    FROM "Appointment" a
    WHERE a."status" IN ('NEW', 'CONFIRMED')
      AND a."deletedAt" IS NULL
    ORDER BY LOWER(TRIM(a."childName")) ASC, a."date" ASC, a."time" ASC
  `;

  return rows.map((row) => ({
    ...row,
    date: dateKey(row.date),
    day: dayLabel(row.date),
    status: statusLabels[row.status],
  })) satisfies AdminPatient[];
}

export async function getAdminPatientDetails(appointmentId: string): Promise<AdminPatientAppointment | null> {
  if (!appointmentId.trim()) {
    return null;
  }

  const rows = await prisma.$queryRaw<AppointmentRow[]>`
    SELECT
      "id",
      "date",
      "time",
      "durationMin",
      "childName",
      "childAge",
      "parentName",
      "phone",
      "email",
      "notes",
      "status"
    FROM "Appointment" a
    WHERE a."id" = ${appointmentId}
      AND a."deletedAt" IS NULL
    LIMIT 1
  `;

  if (!rows[0]) {
    return null;
  }

  return {
    ...rows[0],
    date: dateKey(rows[0].date),
    day: dayLabel(rows[0].date),
    status: statusLabels[rows[0].status],
  };
}
