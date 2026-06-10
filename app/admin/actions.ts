"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ADMIN_FEATURES, getCurrentAdminUser, isKnownFeature, requireFeature, requireMasterUser } from "@/lib/admin-features";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { formatScheduleDate } from "@/lib/schedule";

export type CreateAdminUserState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type UpdateUserAccessState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type AccountPasswordState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type SoftDeletePatientState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type BlockScheduleDateState = {
  message: string;
  status: "error" | "idle" | "success";
};

const createAdminUserSchema = z.object({
  email: z.string().trim().email("Email invalid"),
  name: z.string().trim().optional(),
  password: z.string().min(6, "Parola trebuie sa aiba cel putin 6 caractere"),
});

const accountPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Parola curenta este obligatorie"),
  newPassword: z.string().min(6, "Parola noua trebuie sa aiba cel putin 6 caractere"),
  confirmPassword: z.string().min(6, "Confirmarea parolei este obligatorie"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Parolele nu coincid",
  path: ["confirmPassword"],
});

function normalizedPatientName(value: string) {
  return value.trim().toLocaleLowerCase("ro-RO");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getBlockedDateNotificationRecipients() {
  const rows = await prisma.$queryRaw<Array<{ email: string }>>`
    SELECT "email"
    FROM "User"
    WHERE "receivesBlockedDateEmails" = true
    ORDER BY "createdAt" ASC
  `;

  return rows.map((row) => row.email).filter(Boolean);
}

export async function updateOwnPassword(_prevState: AccountPasswordState, formData: FormData): Promise<AccountPasswordState> {
  const currentUser = await getCurrentAdminUser();
  const result = accountPasswordSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });

  if (!result.success) {
    return {
      message: result.error.issues[0]?.message ?? "Datele nu sunt valide.",
      status: "error",
    };
  }

  const users = await prisma.$queryRaw<Array<{ id: string; password: string | null }>>`
    SELECT "id", "password"
    FROM "User"
    WHERE "id" = ${currentUser.id}
    LIMIT 1
  `;
  const user = users[0];

  if (!user?.password) {
    return {
      message: "Contul nu are parola setata.",
      status: "error",
    };
  }

  const passwordMatches = await bcrypt.compare(result.data.currentPassword, user.password);
  if (!passwordMatches) {
    return {
      message: "Parola curenta este incorecta.",
      status: "error",
    };
  }

  const hashedPassword = await bcrypt.hash(result.data.newPassword, 10);
  await prisma.$executeRaw`
    UPDATE "User"
    SET "password" = ${hashedPassword}, "updatedAt" = NOW()
    WHERE "id" = ${currentUser.id}
  `;

  return {
    message: "Parola a fost actualizata.",
    status: "success",
  };
}

export async function createAdminUser(_prevState: CreateAdminUserState, formData: FormData): Promise<CreateAdminUserState> {
  const currentUser = await requireMasterUser();
  const result = createAdminUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      message: result.error.issues[0]?.message ?? "Datele contului nu sunt valide.",
      status: "error",
    };
  }

  const { name, password } = result.data;
  const email = result.data.email.toLowerCase();
  const isMasterUser = formData.get("isMasterUser") === "on";
  const receivesAppointmentEmails = formData.get("receivesAppointmentEmails") === "on";
  const receivesBlockedDateEmails = formData.get("receivesBlockedDateEmails") === "on";
  const grantedFeatures = formData
    .getAll("features")
    .map(String)
    .filter(isKnownFeature);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return {
      message: "Exista deja un utilizator cu acest email.",
      status: "error",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        email,
        id: userId,
        isMasterUser,
        name: name || null,
        password: hashedPassword,
        receivesAppointmentEmails,
        receivesBlockedDateEmails,
      },
    });

    if (!isMasterUser) {
      for (const featureKey of grantedFeatures) {
        await tx.userFeatureGrant.create({
          data: {
            createdBy: currentUser.id,
            featureKey,
            id: crypto.randomUUID(),
            userId,
          },
        });
      }
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return {
    message: "Utilizatorul a fost creat.",
    status: "success",
  };
}

export async function updateUserAccess(formData: FormData): Promise<UpdateUserAccessState> {
  const currentUser = await requireMasterUser();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return {
      message: "Utilizator invalid.",
      status: "error",
    };
  }

  const name = String(formData.get("name") ?? "").trim();
  const emailResult = z.string().trim().email("Email invalid").safeParse(formData.get("email"));
  const temporaryPassword = String(formData.get("temporaryPassword") ?? "");
  const isMasterUser = formData.get("isMasterUser") === "on";
  const receivesAppointmentEmails = formData.get("receivesAppointmentEmails") === "on";
  const receivesBlockedDateEmails = formData.get("receivesBlockedDateEmails") === "on";
  const grantedFeatures = formData
    .getAll("features")
    .map(String)
    .filter(isKnownFeature);

  if (!emailResult.success) {
    return {
      message: emailResult.error.issues[0]?.message ?? "Email invalid.",
      status: "error",
    };
  }

  const email = emailResult.data.toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: userId,
      },
    },
  });

  if (existingUser) {
    return {
      message: "Exista deja un utilizator cu acest email.",
      status: "error",
    };
  }

  if (temporaryPassword && temporaryPassword.length < 6) {
    return {
      message: "Parola temporara trebuie sa aiba cel putin 6 caractere.",
      status: "error",
    };
  }

  const hashedTemporaryPassword = temporaryPassword ? await bcrypt.hash(temporaryPassword, 10) : null;

  await prisma.$executeRaw`
    UPDATE "User"
    SET
      "name" = ${name || null},
      "email" = ${email},
      "isMasterUser" = ${userId === currentUser.id ? true : isMasterUser},
      "receivesAppointmentEmails" = ${receivesAppointmentEmails},
      "receivesBlockedDateEmails" = ${receivesBlockedDateEmails},
      "password" = COALESCE(${hashedTemporaryPassword}, "password"),
      "updatedAt" = NOW()
    WHERE "id" = ${userId}
  `;

  await prisma.$executeRaw`
    DELETE FROM "UserFeatureGrant"
    WHERE "userId" = ${userId}
  `;

  if (!isMasterUser || userId === currentUser.id) {
    for (const feature of ADMIN_FEATURES) {
      if (!grantedFeatures.includes(feature.key)) {
        continue;
      }

      await prisma.$executeRaw`
        INSERT INTO "UserFeatureGrant" ("id", "userId", "featureKey", "createdBy")
        VALUES (${crypto.randomUUID()}, ${userId}, ${feature.key}, ${currentUser.id})
        ON CONFLICT ("userId", "featureKey") DO NOTHING
      `;
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");

  return {
    message: hashedTemporaryPassword ? "Utilizatorul a fost actualizat si parola temporara a fost setata." : "Utilizatorul a fost actualizat.",
    status: "success",
  };
}

export async function softDeletePatient(patientId: string): Promise<SoftDeletePatientState> {
  const currentUser = await requireFeature("patients.manage");
  const appointmentId = String(patientId ?? "").trim();

  if (!appointmentId) {
    return {
      message: "Pacient invalid.",
      status: "error",
    };
  }

  const appointments = await prisma.$queryRaw<Array<{ childName: string }>>`
    SELECT "childName"
    FROM "Appointment"
    WHERE "id" = ${appointmentId}
    LIMIT 1
  `;
  const appointment = appointments[0];

  if (!appointment?.childName.trim()) {
    return {
      message: "Pacientul nu a fost gasit.",
      status: "error",
    };
  }

  const normalizedName = normalizedPatientName(appointment.childName);

  await prisma.$executeRaw`
    INSERT INTO "DeletedPatient" ("id", "normalizedName", "displayName", "deletedBy")
    VALUES (${crypto.randomUUID()}, ${normalizedName}, ${appointment.childName.trim()}, ${currentUser.id})
    ON CONFLICT ("normalizedName") DO UPDATE SET
      "displayName" = EXCLUDED."displayName",
      "deletedAt" = NOW(),
      "deletedBy" = EXCLUDED."deletedBy"
  `;

  revalidatePath("/admin");
  revalidatePath("/admin/programari");
  revalidatePath("/admin/pacienti");
  revalidatePath(`/admin/pacienti/${appointmentId}`);

  return {
    message: "Pacientul a fost ascuns din UI.",
    status: "success",
  };
}

function parsePriceCents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

function parseOptionalPercent(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return 0;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    return 0;
  }

  return parsed;
}

function parseOptionalDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isInteger(parsed) ? parsed : 0;
}

function readServiceForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceCents = parsePriceCents(formData.get("price"));
  const discountPercent = parseOptionalPercent(formData.get("discountPercent"));
  const discountStartsAt = parseOptionalDate(formData.get("discountStartsAt"));
  const discountEndsAt = parseOptionalDate(formData.get("discountEndsAt"));

  if (!name || priceCents === null) {
    return null;
  }

  return {
    currency: "RON",
    description: description || null,
    discountEndsAt,
    discountEnabled: formData.get("discountEnabled") === "on",
    discountPercent,
    discountStartsAt,
    isPaused: formData.get("isPaused") === "on",
    name,
    priceCents,
    sortOrder: parseSortOrder(formData.get("sortOrder")),
  };
}

export async function createMedicalService(formData: FormData) {
  await requireFeature("services.manage");
  const service = readServiceForm(formData);

  if (!service) {
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "MedicalService" (
      "id",
      "name",
      "description",
      "priceCents",
      "currency",
      "isPaused",
      "discountEnabled",
      "discountPercent",
      "discountStartsAt",
      "discountEndsAt",
      "sortOrder",
      "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${service.name},
      ${service.description},
      ${service.priceCents},
      ${service.currency},
      ${service.isPaused},
      ${service.discountEnabled},
      ${service.discountPercent},
      ${service.discountStartsAt},
      ${service.discountEndsAt},
      ${service.sortOrder},
      NOW()
    )
  `;

  revalidatePath("/");
  revalidatePath("/servicii");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/servicii");
}

export async function updateMedicalService(formData: FormData) {
  await requireFeature("services.manage");
  const serviceId = String(formData.get("serviceId") ?? "");
  const service = readServiceForm(formData);

  if (!serviceId || !service) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "MedicalService"
    SET
      "name" = ${service.name},
      "description" = ${service.description},
      "priceCents" = ${service.priceCents},
      "currency" = ${service.currency},
      "isPaused" = ${service.isPaused},
      "discountEnabled" = ${service.discountEnabled},
      "discountPercent" = ${service.discountPercent},
      "discountStartsAt" = ${service.discountStartsAt},
      "discountEndsAt" = ${service.discountEndsAt},
      "sortOrder" = ${service.sortOrder},
      "updatedAt" = NOW()
    WHERE "id" = ${serviceId}
  `;

  revalidatePath("/");
  revalidatePath("/servicii");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/servicii");
}

export async function deleteMedicalService(formData: FormData) {
  await requireFeature("services.manage");
  const serviceId = String(formData.get("serviceId") ?? "");

  if (!serviceId) {
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM "MedicalService"
    WHERE "id" = ${serviceId}
  `;

  revalidatePath("/");
  revalidatePath("/servicii");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/servicii");
}

function parseDayOfWeek(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : null;
}

function parseDurationMin(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 30;
}

function isTimeValue(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

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

function readScheduleSlotForm(formData: FormData) {
  const dayOfWeek = parseDayOfWeek(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const durationMin = parseDurationMin(formData.get("durationMin"));

  if (dayOfWeek === null || !isTimeValue(startTime) || !isTimeValue(endTime) || startTime >= endTime) {
    return null;
  }

  return {
    dayOfWeek,
    durationMin,
    endTime,
    isPaused: formData.get("isPaused") === "on",
    sortOrder: parseSortOrder(formData.get("sortOrder")),
    startTime,
  };
}

export async function createScheduleSlot(formData: FormData) {
  await requireFeature("schedule.manage");
  const slot = readScheduleSlotForm(formData);

  if (!slot) {
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "ClinicScheduleSlot" (
      "id",
      "dayOfWeek",
      "startTime",
      "endTime",
      "durationMin",
      "isPaused",
      "sortOrder",
      "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${slot.dayOfWeek},
      ${slot.startTime},
      ${slot.endTime},
      ${slot.durationMin},
      ${slot.isPaused},
      ${slot.sortOrder},
      NOW()
    )
  `;

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/program");
}

export async function updateScheduleSlot(formData: FormData) {
  await requireFeature("schedule.manage");
  const slotId = String(formData.get("slotId") ?? "");
  const slot = readScheduleSlotForm(formData);

  if (!slotId || !slot) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "ClinicScheduleSlot"
    SET
      "dayOfWeek" = ${slot.dayOfWeek},
      "startTime" = ${slot.startTime},
      "endTime" = ${slot.endTime},
      "durationMin" = ${slot.durationMin},
      "isPaused" = ${slot.isPaused},
      "sortOrder" = ${slot.sortOrder},
      "updatedAt" = NOW()
    WHERE "id" = ${slotId}
  `;

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/program");
}

export async function deleteScheduleSlot(formData: FormData) {
  await requireFeature("schedule.manage");
  const slotId = String(formData.get("slotId") ?? "");

  if (!slotId) {
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM "ClinicScheduleSlot"
    WHERE "id" = ${slotId}
  `;

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/program");
}

function blockedDateFromValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function blockedPeriodLabel(date: string, endDate: string, startTime?: string, endTime?: string) {
  const dateLabel = formatScheduleDate(date);
  const endDateLabel = formatScheduleDate(endDate);
  const period = date === endDate ? dateLabel : `${dateLabel} - ${endDateLabel}`;
  const time = startTime && endTime && date === endDate ? `, ${startTime} - ${endTime}` : "";

  return `${period}${time}`;
}

type BlockedDateAppointmentEmailRow = {
  childAge: string | null;
  childName: string;
  date: Date;
  email: string | null;
  notes: string | null;
  parentName: string;
  phone: string;
  service: string;
  status: string;
  time: string;
};

function appointmentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelata",
    COMPLETED: "Finalizata",
    CONFIRMED: "Confirmata",
    NEW: "Noua",
  };

  return labels[status] ?? status;
}

function blockedDateNotificationText({
  appointments,
  date,
  endDate,
  endTime,
  reason,
  startTime,
}: {
  appointments: BlockedDateAppointmentEmailRow[];
  date: string;
  endDate: string;
  endTime?: string;
  reason: string;
  startTime?: string;
}) {
  const reasonLabel = reason || "-";
  const periodLabel = blockedPeriodLabel(date, endDate, startTime, endTime);

  return [
    `Ai planificat timp liber in ${periodLabel} pentru motivul: ${reasonLabel}.`,
    "",
    "In perioada respectiva ai urmatoarele programari. Suna pacientii ca sa ii anunti si sa ii reprogramezi:",
    "",
    ...appointments.map((appointment) => {
      return [
        `Data: ${formatScheduleDate(appointment.date)}`,
        `${appointment.time} - ${appointment.service}`,
        `Copil: ${appointment.childName}${appointment.childAge ? ` (${appointment.childAge})` : ""}`,
        `Parinte: ${appointment.parentName}`,
        `Telefon: ${appointment.phone}`,
        `Email: ${appointment.email || "-"}`,
        `Status: ${appointmentStatusLabel(appointment.status)}`,
        `Motiv: ${appointment.notes || "-"}`,
      ].join(" | ");
    }),
  ].join("\n");
}

function blockedDateNotificationHtml({
  appointments,
  date,
  endDate,
  endTime,
  reason,
  startTime,
}: {
  appointments: BlockedDateAppointmentEmailRow[];
  date: string;
  endDate: string;
  endTime?: string;
  reason: string;
  startTime?: string;
}) {
  const reasonLabel = reason || "-";
  const periodLabel = blockedPeriodLabel(date, endDate, startTime, endTime);

  return `
    <div style="margin:0;padding:24px;background:#f4faf8;font-family:Arial,Helvetica,sans-serif;color:#143047;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #d7e8ea;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:20px 22px;background:#8a2525;color:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ffd6d2;">Cardiopedi</div>
            <div style="font-size:22px;font-weight:800;line-height:1.2;margin-top:6px;">Ai planificat timp liber cu programari existente</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 22px;">
            <div style="display:inline-block;background:#fdf1f0;color:#9a2a2a;border-radius:8px;padding:8px 10px;font-size:14px;font-weight:800;margin-bottom:12px;">
              ${escapeHtml(periodLabel)}
            </div>
            <p style="margin:0 0 16px;color:#4e6a78;font-size:15px;line-height:1.6;">
              Ai planificat timp liber in ${escapeHtml(periodLabel)} pentru motivul: <strong>${escapeHtml(reasonLabel)}</strong>.
              In perioada respectiva ai urmatoarele programari. Suna pacientii ca sa ii anunti si sa ii reprogramezi.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
              <tr>
                <th align="left" style="padding:8px 6px;border-bottom:2px solid #d7e8ea;color:#5e7784;font-size:11px;text-transform:uppercase;">Data / ora</th>
                <th align="left" style="padding:8px 6px;border-bottom:2px solid #d7e8ea;color:#5e7784;font-size:11px;text-transform:uppercase;">Programare</th>
                <th align="left" style="padding:8px 6px;border-bottom:2px solid #d7e8ea;color:#5e7784;font-size:11px;text-transform:uppercase;">Contact</th>
                <th align="left" style="padding:8px 6px;border-bottom:2px solid #d7e8ea;color:#5e7784;font-size:11px;text-transform:uppercase;">Note</th>
              </tr>
              ${appointments.map((appointment) => `
                <tr>
                  <td style="width:94px;padding:9px 6px;border-bottom:1px solid #e6f0f1;color:#143047;font-size:13px;font-weight:800;vertical-align:top;">
                    ${escapeHtml(formatScheduleDate(appointment.date))}<br />
                    <span style="color:#9a2a2a;">${escapeHtml(appointment.time)}</span>
                  </td>
                  <td style="padding:9px 6px;border-bottom:1px solid #e6f0f1;color:#143047;line-height:1.35;vertical-align:top;">
                    <strong>${escapeHtml(appointment.childName)}</strong>${appointment.childAge ? ` <span style="color:#5e7784;">(${escapeHtml(appointment.childAge)})</span>` : ""}<br />
                    <span style="color:#5e7784;">${escapeHtml(appointment.service)} · ${escapeHtml(appointmentStatusLabel(appointment.status))}</span>
                  </td>
                  <td style="padding:9px 6px;border-bottom:1px solid #e6f0f1;color:#143047;line-height:1.35;vertical-align:top;">
                    <strong>${escapeHtml(appointment.parentName)}</strong><br />
                    <span style="color:#5e7784;">${escapeHtml(appointment.phone)}${appointment.email ? ` · ${escapeHtml(appointment.email)}` : ""}</span>
                  </td>
                  <td style="padding:9px 6px;border-bottom:1px solid #e6f0f1;color:#5e7784;line-height:1.35;vertical-align:top;">
                    ${escapeHtml(appointment.notes || "-")}
                  </td>
                </tr>
              `).join("")}
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function blockScheduleDate(_prevState: BlockScheduleDateState, formData: FormData): Promise<BlockScheduleDateState> {
  const currentUser = await requireFeature("schedule.manage");
  const date = String(formData.get("date") ?? "").trim();
  const blockMode = String(formData.get("blockMode") ?? "single");
  const endDate = blockMode === "range" ? String(formData.get("endDate") ?? "").trim() : date;
  const startTime = blockMode === "single" ? String(formData.get("startTime") ?? "").trim() : "";
  const endTime = blockMode === "single" ? String(formData.get("endTime") ?? "").trim() : "";
  const hasPartialTime = Boolean(startTime || endTime);
  const reason = String(formData.get("reason") ?? "").trim();

  if (!isDateValue(date) || !isDateValue(endDate) || endDate < date) {
    return {
      message: "Alege o perioada valida.",
      status: "error",
    };
  }

  if (hasPartialTime && (!isTimeValue(startTime) || !isTimeValue(endTime) || startTime >= endTime)) {
    return {
      message: "Alege un interval orar valid pentru timpul liber partial.",
      status: "error",
    };
  }

  const blockedDate = blockedDateFromValue(date);
  const blockedEndDate = blockedDateFromValue(endDate);
  const activeScheduleSlots = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "ClinicScheduleSlot"
    WHERE "isPaused" = false
      AND "dayOfWeek" IN (
        SELECT EXTRACT(DOW FROM day)::int
        FROM generate_series(${blockedDate}::timestamp, ${blockedEndDate}::timestamp, interval '1 day') AS day
      )
    LIMIT 1
  `;

  if (!activeScheduleSlots[0]) {
    return {
      message: blockMode === "range"
        ? "Intervalul selectat nu include nicio zi din programul de lucru al cabinetului."
        : "Ziua selectata oricum nu este in programul de lucru al cabinetului.",
      status: "error",
    };
  }

  await prisma.$executeRaw`
    INSERT INTO "ClinicBlockedDate" ("id", "date", "endDate", "startTime", "endTime", "reason", "createdBy")
    VALUES (
      ${crypto.randomUUID()},
      ${blockedDate},
      ${blockedEndDate},
      ${hasPartialTime ? startTime : null},
      ${hasPartialTime ? endTime : null},
      ${reason || null},
      ${currentUser.id}
    )
    ON CONFLICT ("date") DO UPDATE SET
      "endDate" = EXCLUDED."endDate",
      "startTime" = EXCLUDED."startTime",
      "endTime" = EXCLUDED."endTime",
      "reason" = EXCLUDED."reason",
      "createdBy" = EXCLUDED."createdBy"
  `;

  const existingAppointments = await prisma.$queryRaw<Array<{
    childAge: string | null;
    childName: string;
    date: Date;
    email: string | null;
    notes: string | null;
    parentName: string;
    phone: string;
    service: string;
    status: string;
    time: string;
  }>>`
    SELECT "childAge", "childName", "date", "email", "notes", "parentName", "phone", "service", "status", "time"
    FROM "Appointment"
    WHERE "date" BETWEEN ${blockedDate} AND ${blockedEndDate}
      AND "status" <> 'CANCELLED'
      AND (
        ${hasPartialTime} = false
        OR ("time" >= ${startTime} AND "time" < ${endTime})
      )
    ORDER BY "date" ASC, "time" ASC
  `;

  if (existingAppointments.length > 0) {
    try {
      const recipients = await getBlockedDateNotificationRecipients();
      if (recipients.length > 0) {
        await sendMail({
          html: blockedDateNotificationHtml({ appointments: existingAppointments, date, endDate, endTime: hasPartialTime ? endTime : undefined, reason, startTime: hasPartialTime ? startTime : undefined }),
          subject: `Timp liber planificat ${date === endDate ? date : `${date} - ${endDate}`}: programari de anuntat`,
          text: blockedDateNotificationText({ appointments: existingAppointments, date, endDate, endTime: hasPartialTime ? endTime : undefined, reason, startTime: hasPartialTime ? startTime : undefined }),
          to: recipients,
        });
      }
    } catch (error) {
      console.error("Blocked date appointment notification email error:", error);
    }
  }

  revalidatePath("/");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/program");

  return {
    message: existingAppointments.length > 0
      ? `Timpul liber a fost planificat. Exista ${existingAppointments.length} programari active pentru reprogramare.`
      : "Timpul liber a fost planificat.",
    status: "success",
  };
}

export async function deleteBlockedScheduleDate(formData: FormData) {
  await requireFeature("schedule.manage");
  const blockedDateId = String(formData.get("blockedDateId") ?? "").trim();

  if (!blockedDateId) {
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM "ClinicBlockedDate"
    WHERE "id" = ${blockedDateId}
  `;

  revalidatePath("/");
  revalidatePath("/programari");
  revalidatePath("/admin/setari/program");
}

export async function confirmAppointment(appointmentId: string) {
  await requireFeature("appointments.manage");

  const id = String(appointmentId ?? "").trim();

  if (!id) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Appointment"
    SET "status" = 'CONFIRMED', "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;

  revalidatePath("/admin");
  revalidatePath("/admin/programari");
}

export async function deleteAppointment(appointmentId: string) {
  await requireFeature("appointments.manage");

  const id = String(appointmentId ?? "").trim();

  if (!id) {
    return;
  }

  await prisma.$executeRaw`
    UPDATE "Appointment"
    SET "status" = 'CANCELLED', "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;

  revalidatePath("/");
  revalidatePath("/programari");
  revalidatePath("/admin");
  revalidatePath("/admin/programari");
}

export async function rescheduleAppointment(appointmentId: string, date: string, time: string, allowOutsideSchedule = false) {
  await requireFeature("appointments.manage");

  const id = String(appointmentId ?? "").trim();
  const nextDate = String(date ?? "").trim();
  const nextTime = String(time ?? "").trim();

  if (!id || !isDateValue(nextDate) || !isTimeValue(nextTime)) {
    return { message: "Data sau ora nu este valida.", status: "error" as const };
  }

  const appointment = await prisma.$queryRaw<Array<{ durationMin: number; id: string; status: string }>>`
    SELECT "durationMin", "id", "status"
    FROM "Appointment"
    WHERE "id" = ${id}
    LIMIT 1
  `;

  if (!appointment[0] || appointment[0].status === "CANCELLED") {
    return { message: "Programarea nu mai poate fi mutata.", status: "error" as const };
  }

  const dayOfWeek = weekdayFromDateValue(nextDate);
  const blockedDate = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "ClinicBlockedDate"
    WHERE ${dateFromValue(nextDate)} BETWEEN "date" AND COALESCE("endDate", "date")
      AND (
        "startTime" IS NULL
        OR "endTime" IS NULL
        OR "date" <> COALESCE("endDate", "date")
        OR (${nextTime} >= "startTime" AND ${nextTime} < "endTime")
      )
    LIMIT 1
  `;

  if (blockedDate[0] && !allowOutsideSchedule) {
    return { message: "Perioada aleasa nu este disponibila in programul cabinetului.", status: "error" as const };
  }

  const scheduleSlots = await prisma.$queryRaw<Array<{ startTime: string; endTime: string; durationMin: number }>>`
    SELECT "startTime", "endTime", "durationMin"
    FROM "ClinicScheduleSlot"
    WHERE "isPaused" = false AND "dayOfWeek" = ${dayOfWeek}
    ORDER BY "sortOrder" ASC, "startTime" ASC
  `;
  const matchingScheduleSlot = scheduleSlots.find((slot) => buildSlots(slot.startTime, slot.endTime, slot.durationMin).includes(nextTime));

  if (!matchingScheduleSlot && !allowOutsideSchedule) {
    return { message: "Slotul ales nu este disponibil in program.", status: "error" as const };
  }

  const appointmentDate = dateFromValue(nextDate);
  const occupied = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Appointment"
    WHERE "date" = ${appointmentDate}
      AND "time" = ${nextTime}
      AND "status" <> 'CANCELLED'
      AND "id" <> ${id}
    LIMIT 1
  `;

  if (occupied[0]) {
    return { message: "Slotul ales este deja ocupat.", status: "error" as const };
  }

  await prisma.$executeRaw`
    UPDATE "Appointment"
    SET
      "date" = ${appointmentDate},
      "time" = ${nextTime},
      "durationMin" = ${matchingScheduleSlot?.durationMin ?? appointment[0].durationMin},
      "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;

  revalidatePath("/");
  revalidatePath("/programari");
  revalidatePath("/admin");
  revalidatePath("/admin/programari");

  return { message: "Programarea a fost mutata.", status: "success" as const };
}
