"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon, Badge, Box, Button, Divider, Group, Modal, Stack, Text, ThemeIcon } from "@mantine/core";
import { AlertTriangle, Baby, CalendarDays, Check, Clock, Mail, MessageSquare, Phone, Stethoscope, Trash2, UserRound, X } from "lucide-react";
import { confirmAppointment, deleteAppointment } from "@/app/admin/actions";
import type { Appointment } from "./AdminAppointmentsList";
import styles from "../programari.module.css";

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

function AppointmentTitle({ appointment }: { appointment: Appointment }) {
  const color = statusColor[appointment.status] ?? "gray";

  return (
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
  );
}

function PanelDetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Group gap="sm" wrap="nowrap" align="flex-start" className={styles.detailsPanelRow}>
      <ThemeIcon variant="light" color="gray" size={30} radius="md">
        {icon}
      </ThemeIcon>
      <Box className={styles.detailsPanelRowText}>
        <Text size="xs" c="dimmed" fw={700} lh={1.2} tt="uppercase">
          {label}
        </Text>
        <Text size="sm" fw={650} c="#143047">
          {value}
        </Text>
      </Box>
    </Group>
  );
}

export function AppointmentDetailsContent({
  appointment,
  canManageAppointments,
  onClose,
}: {
  appointment: Appointment;
  canManageAppointments: boolean;
  onClose: () => void;
}) {
  return (
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

      {canManageAppointments ? (
        <>
          <Divider />

          <AppointmentActions appointment={appointment} onClose={onClose} />
        </>
      ) : null}
    </Stack>
  );
}

function AppointmentActions({
  appointment,
  onClose,
}: {
  appointment: Appointment;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmStepState, setConfirmStepState] = useState<null | { appointmentId: string; step: "confirm" | "cancel" }>(null);
  const [pending, setPending] = useState(false);
  const confirmStep = confirmStepState?.appointmentId === appointment.id ? confirmStepState.step : null;

  async function runConfirm() {
    setPending(true);
    await confirmAppointment(appointment.id);
    setPending(false);
    setConfirmStepState(null);
    onClose();
    router.refresh();
  }

  async function runCancel() {
    setPending(true);
    await deleteAppointment(appointment.id);
    setPending(false);
    setConfirmStepState(null);
    onClose();
    router.refresh();
  }

  const alreadyConfirmed = appointment.status === "Confirmata";

  return (
    <>
      {confirmStep === null ? (
        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="red"
            leftSection={<Trash2 size={16} />}
            onClick={() => setConfirmStepState({ appointmentId: appointment.id, step: "cancel" })}
          >
            Anuleaza programarea
          </Button>
          {!alreadyConfirmed ? (
            <Button color="green" leftSection={<Check size={16} />} onClick={() => setConfirmStepState({ appointmentId: appointment.id, step: "confirm" })}>
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
                {confirmStep === "cancel" ? "Anulezi aceasta programare?" : "Confirmi aceasta programare?"}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {confirmStep === "cancel"
                  ? "Programarea va fi pastrata in baza de date, dar nu va mai aparea in calendar."
                  : "Pacientul va aparea ca avand programarea confirmata."}
              </Text>
            </Box>
          </Group>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={() => setConfirmStepState(null)} disabled={pending}>
              Renunta
            </Button>
            {confirmStep === "cancel" ? (
              <Button color="red" loading={pending} leftSection={<Trash2 size={16} />} onClick={runCancel}>
                Da, anuleaza
              </Button>
            ) : (
              <Button color="green" loading={pending} leftSection={<Check size={16} />} onClick={runConfirm}>
                Da, confirma
              </Button>
            )}
          </Group>
        </Box>
      )}
    </>
  );
}

export function AppointmentDetailsPanel({
  appointment,
  canManageAppointments,
  onClose,
}: {
  appointment: Appointment | null;
  canManageAppointments: boolean;
  onClose: () => void;
}) {
  return (
    <aside className={styles.detailsPanel}>
      {appointment ? (
        <>
          <div className={styles.detailsPanelHeader}>
            <div>
              <Text fw={850} className={styles.detailsPanelTitle}>
                {appointment.service}
              </Text>
            </div>
            <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Inchide detaliile">
              <X size={18} />
            </ActionIcon>
          </div>

          <div className={styles.detailsPanelMeta}>
            <div>
              <Text fw={850} className={styles.detailsPanelTime}>
                {appointment.time}
              </Text>
              <Text size="sm" c="dimmed">
                {appointment.day}, {appointment.date} · {appointment.durationMin} min
              </Text>
            </div>
            <Badge color={statusColor[appointment.status] ?? "gray"} variant="light" radius="sm">
              {appointment.status}
            </Badge>
          </div>

          <div className={styles.detailsPanelBody}>
            <PanelDetailRow icon={<Baby size={17} />} label="Copil" value={appointment.childName} />
            <PanelDetailRow icon={<UserRound size={17} />} label="Parinte" value={appointment.parentName} />
            <PanelDetailRow
              icon={<Phone size={17} />}
              label="Telefon"
              value={
                <Text component="a" href={`tel:${appointment.phone}`} size="sm" fw={700} c="blue">
                  {appointment.phone}
                </Text>
              }
            />
            {appointment.email ? (
              <PanelDetailRow
                icon={<Mail size={17} />}
                label="Email"
                value={
                  <Text component="a" href={`mailto:${appointment.email}`} size="sm" fw={700} c="blue">
                    {appointment.email}
                  </Text>
                }
              />
            ) : null}
            {appointment.notes ? (
              <PanelDetailRow icon={<MessageSquare size={17} />} label="Observatii" value={appointment.notes} />
            ) : null}
          </div>

          {canManageAppointments ? (
            <div className={styles.detailsPanelActions}>
              <AppointmentActions appointment={appointment} onClose={onClose} />
            </div>
          ) : null}
        </>
      ) : (
        <Stack gap="xs" className={styles.detailsPanelEmpty}>
          <ThemeIcon variant="light" color="gray" size={42} radius="md">
            <Stethoscope size={20} />
          </ThemeIcon>
          <Text fw={700}>Alege o programare</Text>
          <Text size="sm" c="dimmed">
            Detaliile apar aici cand selectezi un interval din calendarul zilei.
          </Text>
        </Stack>
      )}
    </aside>
  );
}

export function AppointmentDetailsModal({
  appointment,
  canManageAppointments,
  onClose,
}: {
  appointment: Appointment | null;
  canManageAppointments: boolean;
  onClose: () => void;
}) {
  function handleClose() {
    onClose();
  }

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
          <AppointmentTitle appointment={appointment} />
        ) : null
      }
    >
      {appointment ? (
        <AppointmentDetailsContent appointment={appointment} canManageAppointments={canManageAppointments} onClose={onClose} />
      ) : null}
    </Modal>
  );
}
