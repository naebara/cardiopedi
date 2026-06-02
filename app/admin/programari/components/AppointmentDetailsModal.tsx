"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Box, Button, Divider, Group, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { AlertTriangle, Baby, CalendarDays, Check, Clock, Mail, MessageSquare, Phone, Stethoscope, Trash2, UserRound } from "lucide-react";
import { confirmAppointment, deleteAppointment } from "@/app/admin/actions";
import type { Appointment } from "./AdminAppointmentsList";

const statusColor: Record<string, string> = {
  Cancelata: "red",
  Confirmata: "green",
  Finalizata: "blue",
  Noua: "yellow",
};

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" color="gray" size={34} radius="md">
        {icon}
      </ThemeIcon>
      <Box>
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" lh={1.2}>
          {label}
        </Text>
        <Text size="sm" fw={500}>
          {value}
        </Text>
      </Box>
    </Group>
  );
}

export function AppointmentDetailsModal({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmStep, setConfirmStep] = useState<null | "confirm" | "cancel">(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setConfirmStep(null);
  }, [appointment?.id]);

  function handleClose() {
    if (pending) {
      return;
    }
    setConfirmStep(null);
    onClose();
  }

  async function runConfirm() {
    if (!appointment) {
      return;
    }
    setPending(true);
    await confirmAppointment(appointment.id);
    setPending(false);
    setConfirmStep(null);
    onClose();
    router.refresh();
  }

  async function runCancel() {
    if (!appointment) {
      return;
    }
    setPending(true);
    await deleteAppointment(appointment.id);
    setPending(false);
    setConfirmStep(null);
    onClose();
    router.refresh();
  }

  const color = appointment ? statusColor[appointment.status] ?? "gray" : "gray";
  const alreadyConfirmed = appointment?.status === "Confirmata";

  return (
    <Modal
      opened={Boolean(appointment)}
      onClose={handleClose}
      centered
      radius="lg"
      size="md"
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      title={
        appointment ? (
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" color={color} size={40} radius="md">
              <Stethoscope size={20} />
            </ThemeIcon>
            <Box>
              <Text fw={700} size="lg" lh={1.2}>
                {appointment.service}
              </Text>
              <Badge color={color} variant="light" size="sm" radius="sm" mt={4}>
                {appointment.status}
              </Badge>
            </Box>
          </Group>
        ) : null
      }
    >
      {appointment ? (
        <Stack gap="lg">
          <Stack gap="md">
            <DetailRow
              icon={<CalendarDays size={18} />}
              label="Data"
              value={`${appointment.day}, ${appointment.date}`}
            />
            <DetailRow
              icon={<Clock size={18} />}
              label="Ora"
              value={`${appointment.time} · ${appointment.durationMin} min`}
            />
            <DetailRow icon={<Baby size={18} />} label="Copil" value={appointment.childName} />
            <DetailRow icon={<UserRound size={18} />} label="Parinte" value={appointment.parentName} />
            <DetailRow
              icon={<Phone size={18} />}
              label="Telefon"
              value={
                <Text component="a" href={`tel:${appointment.phone}`} size="sm" fw={500} c="blue">
                  {appointment.phone}
                </Text>
              }
            />
            {appointment.email ? (
              <DetailRow
                icon={<Mail size={18} />}
                label="Email"
                value={
                  <Text component="a" href={`mailto:${appointment.email}`} size="sm" fw={500} c="blue">
                    {appointment.email}
                  </Text>
                }
              />
            ) : null}
            {appointment.notes ? (
              <DetailRow icon={<MessageSquare size={18} />} label="Observatii" value={appointment.notes} />
            ) : null}
          </Stack>

          <Divider />

          {confirmStep === null ? (
            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                color="red"
                leftSection={<Trash2 size={16} />}
                onClick={() => setConfirmStep("cancel")}
              >
                Anuleaza programarea
              </Button>
              {!alreadyConfirmed ? (
                <Button color="green" leftSection={<Check size={16} />} onClick={() => setConfirmStep("confirm")}>
                  Confirma programarea
                </Button>
              ) : null}
            </Group>
          ) : (
            <Box
              p="md"
              style={{
                background: confirmStep === "cancel" ? "#fdf1f0" : "#ecf8f2",
                border: `1px solid ${confirmStep === "cancel" ? "#f1cecb" : "#cde9d8"}`,
                borderRadius: "12px",
              }}
            >
              <Group gap="sm" wrap="nowrap" mb="sm" align="flex-start">
                <ThemeIcon variant="light" color={confirmStep === "cancel" ? "red" : "green"} size={32} radius="md">
                  {confirmStep === "cancel" ? <AlertTriangle size={18} /> : <Check size={18} />}
                </ThemeIcon>
                <Box>
                  <Text fw={700} size="sm">
                    {confirmStep === "cancel" ? "Anulezi definitiv aceasta programare?" : "Confirmi aceasta programare?"}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {confirmStep === "cancel"
                      ? "Programarea va fi stearsa complet si nu mai poate fi recuperata."
                      : "Pacientul va aparea ca avand programarea confirmata."}
                  </Text>
                </Box>
              </Group>
              <Group justify="flex-end" gap="sm">
                <Button variant="default" onClick={() => setConfirmStep(null)} disabled={pending}>
                  Renunta
                </Button>
                {confirmStep === "cancel" ? (
                  <Button color="red" loading={pending} leftSection={<Trash2 size={16} />} onClick={runCancel}>
                    Da, sterge programarea
                  </Button>
                ) : (
                  <Button color="green" loading={pending} leftSection={<Check size={16} />} onClick={runConfirm}>
                    Da, confirma
                  </Button>
                )}
              </Group>
            </Box>
          )}
        </Stack>
      ) : null}
    </Modal>
  );
}
