import type {
  AppointmentResponseDto,
  AppointmentsListResponseDto,
  CheckInPatientRequestDto,
} from '../api/dto';
import type { CheckInAppointmentCommand } from './appointment.commands';
import type { Appointment } from './appointment';

const emptyStringToNull = (value: string): string | null =>
  value === '' ? null : value;

const dateStringToDate = (value: string): Date | null =>
  value === '' ? null : new Date(value);

const optionalNullableStringToDto = (
  value: string | null | undefined,
): string | undefined => value ?? undefined;

export const mapAppointmentFromDto = (
  dto: AppointmentResponseDto,
): Appointment => ({
  id: dto.id,
  clinicId: dto.clinicId,
  patientId: dto.patientId,
  patientName: dto.patientName,
  patientPhone: emptyStringToNull(dto.patientPhone),
  doctorId: dto.doctorId,
  doctorName: dto.doctorName,
  startAt: new Date(dto.startAt),
  endAt: new Date(dto.endAt),
  isEmergency: dto.isEmergency,
  type: emptyStringToNull(dto.type),
  channel: dto.channel,
  status: dto.status,
  notes: emptyStringToNull(dto.notes),
  cancelledAt: dateStringToDate(dto.cancelledAt),
  cancellationReason: emptyStringToNull(dto.cancellationReason),
  createdBy: emptyStringToNull(dto.createdBy),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const mapAppointmentsListFromDto = (
  dto: AppointmentsListResponseDto,
): { appointments: Appointment[]; total: number } => ({
  appointments: dto.appointments.map(mapAppointmentFromDto),
  total: dto.total,
});

export const mapCheckInAppointmentCommandToDto = (
  command: CheckInAppointmentCommand,
): CheckInPatientRequestDto => ({
  appointmentId: command.appointmentId,
  patientId: command.patientId,
  patientName: command.patientName,
  patientPhone: optionalNullableStringToDto(command.patientPhone),
  doctorId: command.doctorId,
  doctorName: command.doctorName,
  appointmentType: optionalNullableStringToDto(command.appointmentType),
  priority: command.priority,
  queueNotes: optionalNullableStringToDto(command.queueNotes),
  arrivedAt: command.arrivedAt?.toISOString(),
});
