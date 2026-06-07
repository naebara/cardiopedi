"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ADMIN_FEATURES, isKnownFeature, requireFeature, requireMasterUser } from "@/lib/admin-features";
import { prisma } from "@/lib/prisma";

export type CreateAdminUserState = {
  message: string;
  status: "error" | "idle" | "success";
};

const createAdminUserSchema = z.object({
  email: z.string().trim().email("Email invalid"),
  name: z.string().trim().optional(),
  password: z.string().min(6, "Parola trebuie sa aiba cel putin 6 caractere"),
});

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

export async function updateUserAccess(formData: FormData) {
  const currentUser = await requireMasterUser();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return;
  }

  const isMasterUser = formData.get("isMasterUser") === "on";
  const grantedFeatures = formData
    .getAll("features")
    .map(String)
    .filter(isKnownFeature);

  await prisma.$executeRaw`
    UPDATE "User"
    SET "isMasterUser" = ${userId === currentUser.id ? true : isMasterUser}
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
