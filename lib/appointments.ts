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
  childAge: string | null;
  childName: string;
  patientId: string;
  parentNames: string[];
  phones: string[];
};

export type AdminPatientAppointment = AdminAppointment;

export type AdminPatientDetails = {
  childName: string;
  childAges: string[];
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
  childAge: string | null;
  parentName: string;
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
      AND NOT EXISTS (
        SELECT 1
        FROM "DeletedPatient" dp
        WHERE dp."normalizedName" = LOWER(TRIM("Appointment"."childName"))
      )
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
    childAge: string | null;
    patientId: string;
    parentNames: string[];
    phones: string[];
  }>>`
    SELECT
      (ARRAY_AGG(a."childName" ORDER BY a."date" DESC, a."time" DESC))[1] AS "childName",
      (ARRAY_AGG(a."childAge" ORDER BY a."date" DESC, a."time" DESC))[1] AS "childAge",
      (ARRAY_AGG(a."id" ORDER BY a."date" DESC, a."time" DESC))[1] AS "patientId",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(a."parentName", '')), NULL) AS "parentNames",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(a."phone", '')), NULL) AS "phones"
    FROM "Appointment" a
    WHERE a."status" IN ('NEW', 'CONFIRMED')
      AND NOT EXISTS (
        SELECT 1
        FROM "DeletedPatient" dp
        WHERE dp."normalizedName" = LOWER(TRIM(a."childName"))
      )
    GROUP BY LOWER(TRIM(a."childName"))
    ORDER BY LOWER(TRIM(a."childName")) ASC
  `;

  return rows.map((row) => ({
    childAge: row.childAge,
    childName: row.childName,
    patientId: row.patientId,
    parentNames: row.parentNames,
    phones: row.phones,
  })) satisfies AdminPatient[];
}

export async function getAdminPatientDetails(patientId: string): Promise<AdminPatientDetails | null> {
  if (!patientId.trim()) {
    return null;
  }

  const patientAnchor = await prisma.$queryRaw<Array<{ childName: string }>>`
    SELECT a."childName"
    FROM "Appointment" a
    WHERE a."id" = ${patientId}
      AND NOT EXISTS (
        SELECT 1
        FROM "DeletedPatient" dp
        WHERE dp."normalizedName" = LOWER(TRIM(a."childName"))
      )
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
      "childAge",
      "parentName",
      "phone",
      "email",
      "notes",
      "status"
    FROM "Appointment" a
    WHERE LOWER(TRIM(a."childName")) = LOWER(TRIM(${patientAnchor[0].childName}))
      AND NOT EXISTS (
        SELECT 1
        FROM "DeletedPatient" dp
        WHERE dp."normalizedName" = LOWER(TRIM(a."childName"))
      )
    ORDER BY a."date" DESC, a."time" DESC
  `;

  if (!rows[0]) {
    return null;
  }

  const patientRows = rows.filter((row) => normalizedPatientName(row.childName) === normalizedPatientName(patientAnchor[0].childName));
  const childAges = Array.from(new Set(patientRows.map((row) => row.childAge).filter((age): age is string => Boolean(age))));
  const parentNames = Array.from(new Set(patientRows.map((row) => row.parentName).filter(Boolean)));
  const phones = Array.from(new Set(patientRows.map((row) => row.phone).filter(Boolean)));
  const emails = Array.from(new Set(patientRows.map((row) => row.email).filter((email): email is string => Boolean(email))));

  return {
    childName: patientRows[0].childName,
    childAges,
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
