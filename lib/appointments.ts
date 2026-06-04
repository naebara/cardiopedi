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
  patientId: string;
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

function normalizedPatientName(value: string) {
  return value.trim().toLocaleLowerCase("ro-RO");
}

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
    patientId: string;
    parentNames: string[];
    phones: string[];
  }>>`
    SELECT
      (ARRAY_AGG("childName" ORDER BY "date" DESC, "time" DESC))[1] AS "childName",
      (ARRAY_AGG("id" ORDER BY "date" DESC, "time" DESC))[1] AS "patientId",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF("parentName", '')), NULL) AS "parentNames",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF("phone", '')), NULL) AS "phones"
    FROM "Appointment"
    WHERE "status" IN ('NEW', 'CONFIRMED')
    GROUP BY LOWER("childName")
    ORDER BY LOWER("childName") ASC
  `;

  return rows.map((row) => ({
    childName: row.childName,
    patientId: row.patientId,
    parentNames: row.parentNames,
    phones: row.phones,
  })) satisfies AdminPatient[];
}

export async function getAdminPatientDetails(patientId: string): Promise<AdminPatientDetails | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId)) {
    return null;
  }

  const patientAnchor = await prisma.$queryRaw<Array<{ childName: string }>>`
    SELECT "childName"
    FROM "Appointment"
    WHERE "id" = ${patientId}
    LIMIT 1
  `;

  if (!patientAnchor[0]) {
    return null;
  }

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
    WHERE LOWER("childName") = LOWER(${patientAnchor[0].childName})
    ORDER BY "date" DESC, "time" DESC
  `;

  if (!rows[0]) {
    return null;
  }

  const patientRows = rows.filter((row) => normalizedPatientName(row.childName) === normalizedPatientName(patientAnchor[0].childName));
  const parentNames = Array.from(new Set(patientRows.map((row) => row.parentName).filter(Boolean)));
  const phones = Array.from(new Set(patientRows.map((row) => row.phone).filter(Boolean)));
  const emails = Array.from(new Set(patientRows.map((row) => row.email).filter((email): email is string => Boolean(email))));

  return {
    childName: patientRows[0].childName,
    parentNames,
    phones,
    emails,
    appointments: patientRows.map((row) => ({
      ...row,
      date: dateKey(row.date),
      day: dayLabel(row.date),
      status: statusLabels[row.status],
    })),
  };
}
