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

export type AdminPatient = {
  childName: string;
  parentNames: string[];
  phones: string[];
};

export type AdminPatientAppointment = AdminAppointment;

export type AdminPatientDetails = {
  childName: string;
  parentNames: string[];
  phones: string[];
  emails: string[];
  appointments: AdminPatientAppointment[];
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
    WHERE "status" <> 'CANCELLED'
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

export async function getAdminPatients() {
  const rows = await prisma.$queryRaw<Array<{
    childName: string;
    parentNames: string[];
    phones: string[];
  }>>`
    SELECT
      (ARRAY_AGG("childName" ORDER BY "date" DESC, "time" DESC))[1] AS "childName",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF("parentName", '')), NULL) AS "parentNames",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF("phone", '')), NULL) AS "phones"
    FROM "Appointment"
    WHERE "status" IN ('NEW', 'CONFIRMED')
    GROUP BY LOWER("childName")
    ORDER BY LOWER("childName") ASC
  `;

  return rows.map((row) => ({
    childName: row.childName,
    parentNames: row.parentNames,
    phones: row.phones,
  })) satisfies AdminPatient[];
}

export async function getAdminPatientDetails(childName: string): Promise<AdminPatientDetails | null> {
  const rows = await prisma.$queryRaw<Array<AppointmentRow & {
    email: string | null;
    phone: string;
    parentName: string;
  }>>`
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
    WHERE LOWER("childName") = LOWER(${childName})
    ORDER BY "date" DESC, "time" DESC
  `;

  if (!rows[0]) {
    return null;
  }

  const parentNames = Array.from(new Set(rows.map((row) => row.parentName).filter(Boolean)));
  const phones = Array.from(new Set(rows.map((row) => row.phone).filter(Boolean)));
  const emails = Array.from(new Set(rows.map((row) => row.email).filter((email): email is string => Boolean(email))));

  return {
    childName: rows[0].childName,
    parentNames,
    phones,
    emails,
    appointments: rows.map((row) => ({
      ...row,
      date: dateKey(row.date),
      day: dayLabel(row.date),
      status: statusLabels[row.status],
    })),
  };
}
