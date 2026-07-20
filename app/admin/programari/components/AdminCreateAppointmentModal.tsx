"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Alert, Button, Group, Modal, SimpleGrid, Stack, Text, TextInput, Textarea, ThemeIcon } from "@mantine/core";
import { Baby, CalendarDays, CheckCircle2, Clock, Mail, Phone, Send, UserRound } from "lucide-react";
import { createAdminAppointment, type AppointmentFormState } from "@/app/actions/appointments";
import { validateOptionalEmail } from "@/lib/email-validation";

export type AdminAppointmentDraftSlot = {
  date: string;
  durationMin: number;
  time: string;
};

const initialState: AppointmentFormState = {
  message: "",
  status: "idle",
};

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

function formatDateLabel(value: string) {
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));

  return capitalizeDateLabel(formatted);
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} leftSection={<Send size={16} />} loading={pending} type="submit">
      Salveaza programarea
    </Button>
  );
}

function updateEmailValidity(input: HTMLInputElement, showError = false) {
  const validation = validateOptionalEmail(input.value);
  input.setCustomValidity(validation.isValid ? "" : validation.message);
  if (!validation.isValid && showError) {
    input.reportValidity();
  }
}

export function AdminCreateAppointmentModal({
  onClose,
  slot,
}: {
  onClose: () => void;
  slot: AdminAppointmentDraftSlot | null;
}) {
  const router = useRouter();
  const [formState, formAction] = useActionState(createAdminAppointment, initialState);
  const [phone, setPhone] = useState("");
  const isCreated = formState.status === "success";

  useEffect(() => {
    if (isCreated) {
      router.refresh();
    }
  }, [isCreated, router]);

  function handleClose() {
    onClose();
  }

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={Boolean(slot)}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      radius="lg"
      size="lg"
      title={
        slot ? (
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color="blue" radius="md" size={40} variant="light">
              <CalendarDays size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} lh={1.2}>
                Programare noua
              </Text>
              <Text c="dimmed" size="sm">
                {formatDateLabel(slot.date)} · {slot.time} · {slot.durationMin} min
              </Text>
            </div>
          </Group>
        ) : null
      }
    >
      {slot ? (
        isCreated ? (
          <Stack gap="md">
            <Alert color="green" icon={<CheckCircle2 size={18} />} radius="md" title="Programarea a fost salvata">
              {formState.message}
            </Alert>
            <Group justify="flex-end">
              <Button onClick={handleClose}>Inchide</Button>
            </Group>
          </Stack>
        ) : (
          <form action={formAction}>
            <input name="date" type="hidden" value={slot.date} />
            <input name="time" type="hidden" value={slot.time} />

            <Stack gap="md">
              {formState.status === "error" ? (
                <Alert color="red" radius="md">
                  {formState.message}
                </Alert>
              ) : null}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <TextInput
                  autoComplete="off"
                  label="Nume parinte"
                  leftSection={<UserRound size={16} />}
                  name="parentName"
                  placeholder="Nume si prenume"
                  required
                />
                <TextInput
                  autoComplete="off"
                  label="Nume copil"
                  leftSection={<Baby size={16} />}
                  name="childName"
                  placeholder="Nume copil"
                  required
                />
                <TextInput
                  autoComplete="off"
                  label="Varsta copilului"
                  leftSection={<Baby size={16} />}
                  name="childAge"
                  placeholder="Ex: 4 ani, 8 luni"
                  required
                />
                <TextInput
                  inputMode="numeric"
                  label="Telefon"
                  leftSection={<Phone size={16} />}
                  maxLength={10}
                  minLength={10}
                  name="phone"
                  onChange={(event) => setPhone(event.currentTarget.value.replace(/\D/g, "").slice(0, 10))}
                  pattern="[0-9]{10}"
                  placeholder="07xxxxxxxx"
                  required
                  title="Introdu un numar de telefon valid, format din 10 cifre."
                  type="tel"
                  value={phone}
                />
                <TextInput
                  autoComplete="email"
                  label="Email optional"
                  leftSection={<Mail size={16} />}
                  name="email"
                  onBlur={(event) => updateEmailValidity(event.currentTarget, true)}
                  onChange={(event) => updateEmailValidity(event.currentTarget)}
                  placeholder="email@exemplu.ro"
                  spellCheck={false}
                  type="email"
                />
                <TextInput
                  disabled
                  label="Ora"
                  leftSection={<Clock size={16} />}
                  value={`${slot.time} · ${slot.durationMin} min`}
                />
              </SimpleGrid>

              <Textarea
                autosize
                label="Motivul prezentarii"
                minRows={4}
                name="notes"
                placeholder="Descrie pe scurt motivul consultului sau alte informatii importante"
              />

              <Group justify="flex-end" gap="sm">
                <Button onClick={handleClose} type="button" variant="default">
                  Renunta
                </Button>
                <SubmitButton disabled={false} />
              </Group>
            </Stack>
          </form>
        )
      ) : null}
    </Modal>
  );
}
