"use server";

import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const APPOINTMENT_NOTIFICATION_EMAILS = [
  "natanaelbarag@gmail.com",
];

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAppointmentDate(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(date);

  return formatted.replaceAll(/\p{L}+/gu, (word) => {
    return word.charAt(0).toLocaleUpperCase("ro-RO") + word.slice(1);
  });
}

function appointmentNotificationText(appointment: {
  childName: string;
  childAge: string;
  date: string;
  durationMin: number;
  email: string;
  notes: string;
  parentName: string;
  phone: string;
  service: string;
  time: string;
}) {
  return [
    "Programare noua Cardiopedi",
    "",
    `Data: ${formatAppointmentDate(appointment.date)}`,
    `Ora: ${appointment.time} (${appointment.durationMin} min)`,
    `Serviciu: ${appointment.service}`,
    "",
    `Copil: ${appointment.childName}`,
    `Varsta: ${appointment.childAge || "-"}`,
    `Parinte: ${appointment.parentName}`,
    `Telefon: ${appointment.phone}`,
    `Email: ${appointment.email || "-"}`,
    `Motivul prezentarii: ${appointment.notes || "-"}`,
  ].join("\n");
}

function appointmentNotificationHtml(appointment: {
  childName: string;
  childAge: string;
  date: string;
  durationMin: number;
  email: string;
  notes: string;
  parentName: string;
  phone: string;
  service: string;
  time: string;
}) {
  const rows = [
    ["Data", formatAppointmentDate(appointment.date)],
    ["Ora", `${appointment.time} (${appointment.durationMin} min)`],
    ["Serviciu", appointment.service],
    ["Copil", appointment.childName],
    ["Varsta", appointment.childAge || "-"],
    ["Parinte", appointment.parentName],
    ["Telefon", appointment.phone],
    ["Email", appointment.email || "-"],
    ["Motivul prezentarii", appointment.notes || "-"],
  ];

  return `
    <div style="margin:0;padding:24px;background:#f4faf8;font-family:Arial,Helvetica,sans-serif;color:#143047;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d7e8ea;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:20px 22px;background:#143047;color:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a8dfc2;">Cardiopedi</div>
            <div style="font-size:22px;font-weight:800;line-height:1.2;margin-top:6px;">Programare noua</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 22px;">
            <div style="display:inline-block;background:#e9f8f0;color:#1f7660;border-radius:8px;padding:8px 10px;font-size:14px;font-weight:800;margin-bottom:16px;">
              ${escapeHtml(formatAppointmentDate(appointment.date))} · ${escapeHtml(appointment.time)}
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${rows.map(([label, value]) => `
                <tr>
                  <td style="width:116px;padding:10px 0;border-bottom:1px solid #e6f0f1;color:#5e7784;font-size:12px;font-weight:800;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e6f0f1;color:#143047;font-size:15px;font-weight:700;line-height:1.4;vertical-align:top;">${escapeHtml(value)}</td>
                </tr>
              `).join("")}
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function notifyNewAppointment(appointment: {
  childName: string;
  childAge: string;
  date: string;
  durationMin: number;
  email: string;
  notes: string;
  parentName: string;
  phone: string;
  service: string;
  time: string;
}) {
  await sendMail({
    html: appointmentNotificationHtml(appointment),
    subject: `Programare noua: ${appointment.childName} - ${appointment.date} ${appointment.time}`,
    text: appointmentNotificationText(appointment),
    to: APPOINTMENT_NOTIFICATION_EMAILS,
  });
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
  const childAge = textValue(formData, "childAge");
  const phone = textValue(formData, "phone");
  const email = textValue(formData, "email");
  const notes = textValue(formData, "notes");

  if (!isDateValue(date) || !isTimeValue(time) || !service || !parentName || !childName || !childAge || !/^\d{10}$/.test(phone)) {
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

  const appointmentId = crypto.randomUUID();

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
        "childAge",
        "phone",
        "email",
        "notes",
        "updatedAt"
      )
      VALUES (
        ${appointmentId},
        ${appointmentDate},
        ${time},
        ${matchingScheduleSlot.durationMin},
        ${service},
        ${parentName},
        ${childName},
        ${childAge},
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

  try {
    await notifyNewAppointment({
      childName,
      childAge,
      date,
      durationMin: matchingScheduleSlot.durationMin,
      email,
      notes,
      parentName,
      phone,
      service,
      time,
    });
  } catch (error) {
    console.error("New appointment notification email error:", error);
  }

  return {
    message: "Cererea de programare a fost trimisa.",
    status: "success",
  };
}
