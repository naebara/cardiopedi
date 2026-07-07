"use server";

import { revalidatePath } from "next/cache";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { formatScheduleDate } from "@/lib/schedule";
import { clinic } from "../site-data";

type AppointmentEmailData = {
  childName: string;
  childAge: string;
  date: string;
  durationMin: number;
  email: string;
  notes: string;
  parentName: string;
  phone: string;
  time: string;
};

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

function isEmailValue(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  return formatScheduleDate(value);
}

const DEFAULT_APPOINTMENT_SERVICE = "Programare";

function appointmentNotificationText(appointment: AppointmentEmailData) {
  return [
    "Programare noua Cardiopedi",
    "",
    `Data: ${formatAppointmentDate(appointment.date)}`,
    `Ora: ${appointment.time} (${appointment.durationMin} min)`,
    "",
    `Copil: ${appointment.childName}`,
    `Varsta: ${appointment.childAge || "-"}`,
    `Parinte: ${appointment.parentName}`,
    `Telefon: ${appointment.phone}`,
    `Email: ${appointment.email || "-"}`,
    `Motivul prezentarii: ${appointment.notes || "-"}`,
  ].join("\n");
}

function appointmentNotificationHtml(appointment: AppointmentEmailData) {
  const rows = [
    ["Data", formatAppointmentDate(appointment.date)],
    ["Ora", `${appointment.time} (${appointment.durationMin} min)`],
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

function patientConfirmationText(appointment: AppointmentEmailData) {
  return [
    `Buna ziua, ${appointment.parentName},`,
    "",
    "Am primit cererea dumneavoastra de programare la Cardiopedi.",
    "",
    "Detalii programare:",
    `Data: ${formatAppointmentDate(appointment.date)}`,
    `Ora: ${appointment.time} (${appointment.durationMin} min)`,
    `Copil: ${appointment.childName}`,
    `Varsta: ${appointment.childAge || "-"}`,
    "",
    `Locatie: ${clinic.address}`,
    `Harta: ${clinic.mapUrl}`,
    `Telefon: ${clinic.phone}`,
    "",
    "Va rugam sa ajungeti cu cateva minute mai devreme. Daca apare o intarziere sau doriti modificarea programarii, ne puteti contacta telefonic.",
    "",
    "Cu drag,",
    "Echipa Cardiopedi",
  ].join("\n");
}

function patientConfirmationHtml(appointment: AppointmentEmailData) {
  const rows = [
    ["Data", formatAppointmentDate(appointment.date)],
    ["Ora", `${appointment.time} (${appointment.durationMin} min)`],
    ["Copil", appointment.childName],
    ["Varsta", appointment.childAge || "-"],
    ["Locatie", clinic.address],
    ["Telefon", clinic.phone],
  ];

  return `
    <div style="margin:0;padding:24px;background:#f4faf8;font-family:Arial,Helvetica,sans-serif;color:#143047;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #d7e8ea;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:22px 24px;background:#143047;color:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#a8dfc2;">Cardiopedi</div>
            <div style="font-size:24px;font-weight:800;line-height:1.2;margin-top:6px;">Am primit programarea dumneavoastra</div>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px;">
            <p style="margin:0 0 14px;color:#143047;font-size:16px;line-height:1.55;">
              Buna ziua, ${escapeHtml(appointment.parentName)}.
            </p>
            <p style="margin:0 0 18px;color:#4e6a78;font-size:15px;line-height:1.65;">
              Am primit cererea dumneavoastra de programare. Mai jos gasiti detaliile programarii si locatia cabinetului.
            </p>
            <div style="display:inline-block;background:#e9f8f0;color:#1f7660;border-radius:8px;padding:8px 10px;font-size:14px;font-weight:800;margin-bottom:16px;">
              ${escapeHtml(formatAppointmentDate(appointment.date))} · ${escapeHtml(appointment.time)}
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              ${rows.map(([label, value]) => `
                <tr>
                  <td style="width:108px;padding:10px 0;border-bottom:1px solid #e6f0f1;color:#5e7784;font-size:12px;font-weight:800;text-transform:uppercase;vertical-align:top;">${escapeHtml(label)}</td>
                  <td style="padding:10px 0;border-bottom:1px solid #e6f0f1;color:#143047;font-size:15px;font-weight:700;line-height:1.4;vertical-align:top;">${escapeHtml(value)}</td>
                </tr>
              `).join("")}
            </table>
            <p style="margin:20px 0 0;color:#4e6a78;font-size:15px;line-height:1.65;">
              Va rugam sa ajungeti cu cateva minute mai devreme. Daca apare o intarziere sau doriti modificarea programarii, ne puteti contacta telefonic.
            </p>
            <div style="margin-top:22px;">
              <a href="${escapeHtml(clinic.mapUrl)}" style="display:inline-block;background:#1f84ba;color:#ffffff;text-decoration:none;border-radius:8px;padding:13px 18px;font-size:15px;font-weight:800;">
                Deschide locatia in Google Maps
              </a>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function notifyNewAppointment(appointment: AppointmentEmailData) {
  const recipients = await getAppointmentNotificationRecipients();

  if (recipients.length === 0) {
    return;
  }

  await sendMail({
    html: appointmentNotificationHtml(appointment),
    subject: `Programare noua: ${appointment.childName} - ${appointment.date} ${appointment.time}`,
    text: appointmentNotificationText(appointment),
    to: recipients,
  });
}

async function sendPatientConfirmation(appointment: AppointmentEmailData) {
  if (!appointment.email) {
    return;
  }

  await sendMail({
    html: patientConfirmationHtml(appointment),
    subject: `Programarea ta la Cardiopedi - ${appointment.date} ${appointment.time}`,
    text: patientConfirmationText(appointment),
    to: appointment.email,
  });
}

async function getAppointmentNotificationRecipients() {
  const rows = await prisma.$queryRaw<Array<{ email: string }>>`
    SELECT "email"
    FROM "User"
    WHERE "receivesAppointmentEmails" = true
    ORDER BY "createdAt" ASC
  `;

  return rows.map((row) => row.email).filter(Boolean);
}

export async function createAppointment(
  _previousState: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const date = textValue(formData, "date");
  const time = textValue(formData, "time");
  const parentName = textValue(formData, "parentName");
  const childName = textValue(formData, "childName");
  const childAge = textValue(formData, "childAge");
  const phone = textValue(formData, "phone");
  const email = textValue(formData, "email");
  const notes = textValue(formData, "notes");

  if (!isDateValue(date) || !isTimeValue(time) || !parentName || !childName || !childAge || !/^\d{10}$/.test(phone) || !isEmailValue(email)) {
    return {
      message: "Completeaza corect data, ora, telefonul si emailul daca il adaugi.",
      status: "error",
    };
  }

  const dayOfWeek = weekdayFromDateValue(date);
  const blockedDate = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "ClinicBlockedDate"
    WHERE ${dateFromValue(date)} BETWEEN "date" AND COALESCE("endDate", "date")
      AND (
        "startTime" IS NULL
        OR "endTime" IS NULL
        OR "date" <> COALESCE("endDate", "date")
        OR (${time} >= "startTime" AND ${time} < "endTime")
      )
    LIMIT 1
  `;

  if (blockedDate[0]) {
    return {
      message: "Ziua aleasa nu este disponibila pentru programari. Alege o alta data.",
      status: "error",
    };
  }

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
        ${DEFAULT_APPOINTMENT_SERVICE},
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

  const appointmentEmailData = {
    childName,
    childAge,
    date,
    durationMin: matchingScheduleSlot.durationMin,
    email,
    notes,
    parentName,
    phone,
    time,
  };

  try {
    await notifyNewAppointment(appointmentEmailData);
  } catch (error) {
    console.error("New appointment notification email error:", error);
  }

  try {
    await sendPatientConfirmation(appointmentEmailData);
  } catch (error) {
    console.error("Patient appointment confirmation email error:", error);
  }

  return {
    message: email
      ? "Cererea de programare a fost inregistrata. Vei primi confirmarea cu detaliile programarii pe email."
      : "Cererea de programare a fost inregistrata. Nu ai primit email de confirmare pentru ca nu ai completat adresa de email.",
    status: "success",
  };
}
