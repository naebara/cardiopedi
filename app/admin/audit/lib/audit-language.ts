import type { AuditRow } from "./audit-query";
import { auditText } from "../i18n";

const weekdays = ["duminică", "luni", "marți", "miercuri", "joi", "vineri", "sâmbătă"];

function after(row: AuditRow, field: string) {
  return row.changes?.[field]?.after;
}

function before(row: AuditRow, field: string) {
  return row.changes?.[field]?.before;
}

function latest(row: AuditRow, field: string) {
  return after(row, field) ?? before(row, field);
}

function shortId(row: AuditRow) {
  return row.entityId ? `#${row.entityId.slice(0, 8)}` : "selectată";
}

function ipSuffix(row: AuditRow) {
  const ip = row.metadata?.ipAddress;
  return typeof ip === "string" && ip ? ` de pe IP ${ip}` : " (IP indisponibil)";
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric", month: "long", timeZone: "Europe/Bucharest", year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function appointmentMoment(row: AuditRow, prefix: "before" | "after") {
  const getter = prefix === "after" ? after : before;
  const date = formatDate(getter(row, "date"));
  const time = getter(row, "time");
  return [date, typeof time === "string" ? `ora ${time}` : null].filter(Boolean).join(", ");
}

function scheduleInterval(row: AuditRow) {
  const legacyInterval = row.summary.match(/ziua (\d), (\d{2}:\d{2})-(\d{2}:\d{2})/);
  const day = Number(latest(row, "dayOfWeek") ?? legacyInterval?.[1]);
  const start = latest(row, "startTime") ?? legacyInterval?.[2];
  const end = latest(row, "endTime") ?? legacyInterval?.[3];
  const dayLabel = Number.isInteger(day) && weekdays[day] ? weekdays[day] : "ziua selectată";
  const timeLabel = typeof start === "string" && typeof end === "string" ? `, ${start}–${end}` : "";
  return `${dayLabel}${timeLabel}`;
}

function blockedPeriod(row: AuditRow) {
  const startDate = formatDate(latest(row, "date"));
  const endDate = formatDate(latest(row, "endDate"));
  const startTime = latest(row, "startTime");
  const endTime = latest(row, "endTime");
  const dates = startDate && endDate && startDate !== endDate ? `${startDate} – ${endDate}` : startDate;
  const times = typeof startTime === "string" && typeof endTime === "string" ? `, între ${startTime} și ${endTime}` : "";
  const legacyDate = row.summary.match(/\((\d{4}-\d{2}-\d{2})\)/)?.[1];
  return `${dates ?? formatDate(legacyDate) ?? "perioada selectată"}${times}`;
}

function targetEmail(row: AuditRow) {
  const email = latest(row, "email");
  return typeof email === "string" ? email : shortId(row);
}

function serviceName(row: AuditRow) {
  const name = latest(row, "name");
  const legacyName = row.summary.match(/^[^:]+:\s*(.+)$/)?.[1];
  return typeof name === "string" ? `„${name}”` : legacyName ? `„${legacyName}”` : shortId(row);
}

function changedFieldLabels(row: AuditRow) {
  return Object.keys(row.changes ?? {})
    .filter((field) => field !== "temporaryPasswordSet")
    .map((field) => auditText.fields[field as keyof typeof auditText.fields] ?? field)
    .join(", ");
}

export function auditSentence(row: AuditRow) {
  const user = `Utilizatorul ${row.actorEmail}`;

  switch (row.action) {
    case "LOGIN_SUCCESS": return `${user} s-a autentificat${ipSuffix(row)}.`;
    case "LOGIN_FAILED": return `O încercare de autentificare pentru ${row.actorEmail} a eșuat${ipSuffix(row)}.`;
    case "LOGOUT": return `${user} s-a deconectat${ipSuffix(row)}.`;
    case "PASSWORD_CHANGED": return `${user} și-a schimbat parola.`;
    case "PASSWORD_CHANGE_FAILED": return `${user} a încercat să-și schimbe parola, dar verificarea a eșuat.`;
    case "PASSWORD_RESET_REQUESTED": return `A fost finalizată o resetare de parolă pentru ${row.actorEmail}${ipSuffix(row)}.`;
    case "PASSWORD_RESET_FAILED": return `Resetarea parolei pentru ${row.actorEmail} a eșuat${ipSuffix(row)}.`;
    case "APPOINTMENT_CREATED": return `${user} a creat programarea ${shortId(row)} pentru ${formatDate(after(row, "date")) ?? "data selectată"}, ora ${after(row, "time") ?? "selectată"}.`;
    case "APPOINTMENT_CONFIRMED": return `${user} a confirmat programarea ${shortId(row)}.`;
    case "APPOINTMENT_CANCELLED": return `${user} a anulat programarea ${shortId(row)}.`;
    case "APPOINTMENT_RESCHEDULED": return `${user} a mutat programarea ${shortId(row)} din ${appointmentMoment(row, "before")} în ${appointmentMoment(row, "after")}.`;
    case "PATIENT_RECORD_VIEWED": return `${user} a consultat fișa pacientului asociată programării ${shortId(row)}.`;
    case "PATIENT_RECORD_DELETED": return `${user} a șters fișa pacientului și programarea asociată ${shortId(row)}.`;
    case "SCHEDULE_SLOT_CREATED": return `${user} a creat intervalul de lucru de ${scheduleInterval(row)}.`;
    case "SCHEDULE_SLOT_DELETED": return `${user} a șters intervalul de lucru de ${scheduleInterval(row)}.`;
    case "SCHEDULE_SLOT_UPDATED": {
      const pause = row.changes?.isPaused;
      if (pause?.after === true) return `${user} a activat pauza pentru intervalul de ${scheduleInterval(row)}.`;
      if (pause?.after === false) return `${user} a reactivat intervalul de ${scheduleInterval(row)}.`;
      return `${user} a actualizat intervalul de lucru de ${scheduleInterval(row)}.`;
    }
    case "BLOCKED_PERIOD_CREATED": return `${user} a planificat timp liber pentru ${blockedPeriod(row)}.`;
    case "BLOCKED_PERIOD_UPDATED": return `${user} a actualizat timpul liber din ${blockedPeriod(row)}.`;
    case "BLOCKED_PERIOD_DELETED": return `${user} a șters perioada de timp liber ${shortId(row)}.`;
    case "SERVICE_CREATED": return `${user} a creat serviciul ${serviceName(row)}.`;
    case "SERVICE_DELETED": return `${user} a șters serviciul ${serviceName(row)}.`;
    case "SERVICE_UPDATED": {
      const pause = row.changes?.isPaused;
      if (pause?.after === true) return `${user} a pus serviciul ${serviceName(row)} pe pauză.`;
      if (pause?.after === false) return `${user} a reactivat serviciul ${serviceName(row)}.`;
      return `${user} a actualizat serviciul ${serviceName(row)}: ${changedFieldLabels(row)}.`;
    }
    case "ADMIN_USER_CREATED": return `${user} a creat contul administrativ ${targetEmail(row)}.`;
    case "ADMIN_USER_UPDATED": return `${user} a actualizat contul ${targetEmail(row)}: ${changedFieldLabels(row)}.`;
    case "ACCESS_DENIED": return `Accesul utilizatorului ${row.actorEmail} la ${row.entityId ?? "secțiunea solicitată"} a fost refuzat${ipSuffix(row)}.`;
    case "AUDIT_ACCESS_DENIED": return `Accesul utilizatorului ${row.actorEmail} la jurnalul de audit a fost refuzat${ipSuffix(row)}.`;
    default: return `${user}: ${row.summary}`;
  }
}
