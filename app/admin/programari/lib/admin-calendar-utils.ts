export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // We want week to start on Monday (1)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getDatesOfWeek(startDate: Date) {
  const dates = [];
  const start = getStartOfWeek(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function labelDateShort(date: Date) {
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    weekday: "short",
  }).format(date);
  return capitalizeDateLabel(formatted);
}

function capitalizeDateLabel(value: string) {
  let shouldCapitalize = true;

  return Array.from(value, (char) => {
    const isLetter = char.toLocaleLowerCase("ro-RO") !== char.toLocaleUpperCase("ro-RO");
    const next = shouldCapitalize && isLetter ? char.toLocaleUpperCase("ro-RO") : char;

    shouldCapitalize = char === "," || char === " " || char === "-";
    if (isLetter || /\d/.test(char)) {
      shouldCapitalize = false;
    }

    return next;
  }).join("");
}

export function calculateEventPosition(time: string, durationMin: number, startHour: number, pixelsPerHour: number) {
  const eventStartMins = toMinutes(time);
  const dayStartMins = startHour * 60;
  
  const offsetMins = eventStartMins - dayStartMins;
  
  // Example: if offsetMins is 30, and pixelsPerHour is 60, top = 30px
  const top = (offsetMins / 60) * pixelsPerHour;
  const height = (durationMin / 60) * pixelsPerHour;
  
  return { top, height };
}

export function getDatesOfMonthView(currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  
  const startDate = getStartOfWeek(firstDayOfMonth);
  
  const dates = [];
  const d = new Date(startDate);
  
  // A month view grid typically has 35 or 42 days. We'll do 42 (6 weeks) to be safe.
  for (let i = 0; i < 42; i++) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  
  return dates;
}
