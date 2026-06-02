"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type AppointmentFormState = {
  message: string;
  status: "idle" | "success" | "error";
};

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function isDateValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function dateFromValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function weekdayFromDateValue(value: string) {
  return new Date(`${value}T12:00:00.000Z`).getUTCDay();
}

function buildSlots(start: string, end: string, durationMin: number) {
  const slots = [];
  const close = toMinutes(end);
  for (let time = toMinutes(start); time + durationMin <= close; time += durationMin) {
    slots.push(toTime(time));
  }
  return slots;
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createAppointment(
  _previousState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const date = textValue(formData, "date");
  const time = textValue(formData, "time");
  const service = textValue(formData, "service");
  const parentName = textValue(formData, "parentName");
  const childName = textValue(formData, "childName");
  const phone = textValue(formData, "phone");
  const email = textValue(formData, "email");
  const notes = textValue(formData, "notes");

  if (!isDateValue(date) || !isTimeValue(time) || !service || !parentName || !childName || !/^\d{10}$/.test(phone)) {
    return {
      message: "Completeaza corect data, ora, serviciul si datele de contact.",
      status: "error",
    };
  }

  const activeServices = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT "name"
    FROM "MedicalService"
    WHERE "isPaused" = false AND "name" = ${service}
    LIMIT 1
  `;

  if (!activeServices[0]) {
    return {
      message: "Serviciul ales nu mai este disponibil. Reincarca pagina si alege din nou.",
      status: "error",
    };
  }

  const dayOfWeek = weekdayFromDateValue(date);
  const scheduleSlots = await prisma.$queryRaw<Array<{ startTime: string; endTime: string; durationMin: number }>>`
    SELECT "startTime", "endTime", "durationMin"
    FROM "ClinicScheduleSlot"
    WHERE "isPaused" = false AND "dayOfWeek" = ${dayOfWeek}
    ORDER BY "sortOrder" ASC, "startTime" ASC
  `;
  const matchingScheduleSlot = scheduleSlots.find((slot) => buildSlots(slot.startTime, slot.endTime, slot.durationMin).includes(time));

  if (!matchingScheduleSlot) {
    return {
      message: "Ora aleasa nu mai este disponibila. Reincarca pagina si alege alt interval.",
      status: "error",
    };
  }

  const appointmentDate = dateFromValue(date);
  const occupied = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Appointment"
    WHERE "date" = ${appointmentDate}
      AND "time" = ${time}
      AND "status" <> 'CANCELLED'
    LIMIT 1
  `;

  if (occupied[0]) {
    return {
      message: "Ora aleasa tocmai a fost ocupata. Alege un alt interval.",
      status: "error",
    };
  }

  try {
    await prisma.$executeRaw`
      INSERT INTO "Appointment" (
        "id",
        "date",
        "time",
        "durationMin",
        "service",
        "parentName",
        "childName",
        "phone",
        "email",
        "notes",
        "updatedAt"
      )
      VALUES (
        ${crypto.randomUUID()},
        ${appointmentDate},
        ${time},
        ${matchingScheduleSlot.durationMin},
        ${service},
        ${parentName},
        ${childName},
        ${phone},
        ${email || null},
        ${notes || null},
        NOW()
      )
    `;
  } catch {
    return {
      message: "Ora aleasa tocmai a fost ocupata. Alege un alt interval.",
      status: "error",
    };
  }

  revalidatePath("/programari");
  revalidatePath("/admin");
  revalidatePath("/admin/programari");

  return {
    message: "Cererea de programare a fost trimisa si apare in admin cu status Noua.",
    status: "success",
  };
}
