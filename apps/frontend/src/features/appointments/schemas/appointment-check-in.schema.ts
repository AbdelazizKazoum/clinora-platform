import { ApiError } from '@/lib/api';

import type {
  Appointment,
  CheckInAppointmentCommand,
  QueuePriority,
} from '../model';

export interface AppointmentCheckInFormValues {
  priority: QueuePriority;
  queueNotes: string;
}

const trimOptionalString = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const createAppointmentCheckInFormValues = (
  appointment: Appointment,
): AppointmentCheckInFormValues => ({
  priority: appointment.isEmergency ? 'EMERGENCY' : 'NORMAL',
  queueNotes: '',
});

export const mapAppointmentCheckInFormToCommand = (
  appointment: Appointment,
  values: AppointmentCheckInFormValues,
  arrivedAt: Date = new Date(),
): CheckInAppointmentCommand => ({
  clinicId: appointment.clinicId,
  appointmentId: appointment.id,
  patientId: appointment.patientId,
  patientName: appointment.patientName,
  patientPhone: appointment.patientPhone,
  doctorId: appointment.doctorId,
  doctorName: appointment.doctorName,
  appointmentType: appointment.type,
  priority: values.priority,
  queueNotes: trimOptionalString(values.queueNotes),
  arrivedAt,
});

export const mapAppointmentCheckInErrorToMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'This appointment has already been checked into the queue.';
    }

    return error.message || 'Unable to check in the appointment.';
  }

  return error instanceof Error
    ? error.message
    : 'Unable to check in the appointment.';
};
