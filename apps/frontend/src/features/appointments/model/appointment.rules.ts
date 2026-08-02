import type { Appointment, AppointmentStatus } from './appointment';

const nonBlockingAppointmentStatuses: ReadonlySet<AppointmentStatus> = new Set([
  'CANCELLED',
  'NO_SHOW',
]);

export const canCheckInAppointment = (appointment: Appointment): boolean =>
  appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';

export const isValidAppointmentTiming = (
  startAt: Date,
  endAt: Date,
): boolean =>
  Number.isFinite(startAt.getTime()) &&
  Number.isFinite(endAt.getTime()) &&
  endAt.getTime() > startAt.getTime();

export const calculateEndAtFromDuration = (
  startAt: Date,
  durationMinutes: number,
): Date => {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new RangeError('Appointment duration must be greater than 0 minutes.');
  }

  return new Date(startAt.getTime() + durationMinutes * 60_000);
};

export const calculateDurationMinutes = (
  startAt: Date,
  endAt: Date,
): number => Math.round((endAt.getTime() - startAt.getTime()) / 60_000);

export const appointmentsOverlap = (
  firstStartAt: Date,
  firstEndAt: Date,
  secondStartAt: Date,
  secondEndAt: Date,
): boolean =>
  isValidAppointmentTiming(firstStartAt, firstEndAt) &&
  isValidAppointmentTiming(secondStartAt, secondEndAt) &&
  firstStartAt.getTime() < secondEndAt.getTime() &&
  secondStartAt.getTime() < firstEndAt.getTime();

export const isBlockingAppointment = (appointment: Appointment): boolean =>
  !nonBlockingAppointmentStatuses.has(appointment.status);

export const isBlockingOverlap = (
  appointment: Appointment,
  proposedStartAt: Date,
  proposedEndAt: Date,
  options: { allowEmergencyOverride?: boolean } = {},
): boolean => {
  if (options.allowEmergencyOverride) {
    return false;
  }

  return (
    isBlockingAppointment(appointment) &&
    appointmentsOverlap(
      appointment.startAt,
      appointment.endAt,
      proposedStartAt,
      proposedEndAt,
    )
  );
};
