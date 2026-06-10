import { requireFeature } from "@/lib/admin-features";
import {
  getActiveAppointmentCountsByDate,
  getAdminBlockedDates,
  getAdminScheduleSlots,
  scheduleDayOptions,
  scheduleSlotWithDisplay,
} from "@/lib/schedule";
import { ScheduleSettingsTable } from "./ScheduleSettingsTable";

export default async function AdminScheduleSettingsPage() {
  await requireFeature("schedule.manage");
  const [slots, blockedDates, appointmentCountsByDate] = await Promise.all([
    getAdminScheduleSlots(),
    getAdminBlockedDates(),
    getActiveAppointmentCountsByDate(),
  ]);
  const scheduleRows = slots.map((slot) => {
    const displaySlot = scheduleSlotWithDisplay(slot);

    return {
      dayLabel: displaySlot.dayLabel,
      dayOfWeek: slot.dayOfWeek,
      durationMin: slot.durationMin,
      endTime: slot.endTime,
      id: slot.id,
      interval: displaySlot.interval,
      isPaused: slot.isPaused,
      sortOrder: slot.sortOrder,
      startTime: slot.startTime,
    };
  });

  return (
    <ScheduleSettingsTable
      appointmentCountsByDate={appointmentCountsByDate}
      blockedDates={blockedDates}
      dayOptions={scheduleDayOptions}
      slots={scheduleRows}
    />
  );
}
