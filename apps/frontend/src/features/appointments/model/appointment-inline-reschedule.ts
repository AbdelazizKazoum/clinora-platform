import type { Appointment } from './appointment';
import type { RescheduleAppointmentCommand } from './appointment.commands';
import type {
  CheckAppointmentConflictsQuery,
  ConflictResult,
} from './appointment.queries';
import {
  calculateDurationMinutes,
  calculateEndAtFromDuration,
  isValidAppointmentTiming,
} from './appointment.rules';

export type AppointmentInlineRescheduleStatus =
  | 'conflict'
  | 'invalid'
  | 'rescheduled';

export interface BuildAppointmentInlineRescheduleOptions {
  appointment: Appointment;
  newDoctorId?: string | null;
  newDoctorName?: string | null;
  newEndAt: Date | null;
  newStartAt: Date | null;
}

export interface ExecuteAppointmentInlineRescheduleOptions
  extends BuildAppointmentInlineRescheduleOptions {
  checkConflicts: (
    query: CheckAppointmentConflictsQuery,
  ) => Promise<ConflictResult>;
  rescheduleAppointment: (
    command: RescheduleAppointmentCommand,
  ) => Promise<unknown>;
  revert: () => void;
}

export interface AppointmentInlineRescheduleResult {
  command?: RescheduleAppointmentCommand;
  status: AppointmentInlineRescheduleStatus;
}

const isValidDate = (date: Date | null): date is Date =>
  date instanceof Date && Number.isFinite(date.getTime());

export const buildAppointmentInlineRescheduleCommand = ({
  appointment,
  newDoctorId,
  newDoctorName,
  newEndAt,
  newStartAt,
}: BuildAppointmentInlineRescheduleOptions):
  | RescheduleAppointmentCommand
  | null => {
  if (!isValidDate(newStartAt)) return null;
  if (!isValidAppointmentTiming(appointment.startAt, appointment.endAt)) {
    return null;
  }

  const originalDurationMinutes = calculateDurationMinutes(
    appointment.startAt,
    appointment.endAt,
  );
  const resolvedEndAt =
    newEndAt ?? calculateEndAtFromDuration(newStartAt, originalDurationMinutes);

  if (
    !isValidDate(resolvedEndAt) ||
    !isValidAppointmentTiming(newStartAt, resolvedEndAt)
  ) {
    return null;
  }

  return {
    clinicId: appointment.clinicId,
    appointmentId: appointment.id,
    doctorId: newDoctorId ?? appointment.doctorId,
    doctorName: newDoctorName ?? appointment.doctorName,
    newStartAt,
    newEndAt: resolvedEndAt,
  };
};

export const executeAppointmentInlineReschedule = async ({
  appointment,
  checkConflicts,
  rescheduleAppointment,
  revert,
  ...buildOptions
}: ExecuteAppointmentInlineRescheduleOptions): Promise<AppointmentInlineRescheduleResult> => {
  const command = buildAppointmentInlineRescheduleCommand({
    appointment,
    ...buildOptions,
  });

  if (!command) {
    revert();
    return { status: 'invalid' };
  }

  try {
    if (!appointment.isEmergency) {
      const conflict = await checkConflicts({
        clinicId: command.clinicId,
        doctorId: command.doctorId,
        startAt: command.newStartAt,
        endAt: command.newEndAt,
        excludeAppointmentId: appointment.id,
      });

      if (conflict.hasConflict) {
        revert();
        return { command, status: 'conflict' };
      }
    }

    await rescheduleAppointment(command);

    return { command, status: 'rescheduled' };
  } catch (error) {
    revert();
    throw error;
  }
};
