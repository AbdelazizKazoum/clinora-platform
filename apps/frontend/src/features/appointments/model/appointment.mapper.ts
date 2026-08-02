import type {
  AppointmentResponseDto,
  AppointmentsListResponseDto,
  CheckAppointmentConflictsQueryDto,
  CheckInPatientRequestDto,
  CreateAppointmentRequestDto,
  ListAppointmentsQueryDto,
  UpdateAppointmentRequestDto,
  UpdateAppointmentTimingRequestDto,
} from '../api/dto';
import type {
  CancelAppointmentCommand,
  CheckInAppointmentCommand,
  CreateAppointmentCommand,
  RescheduleAppointmentCommand,
  UpdateAppointmentCommand,
} from './appointment.commands';
import type {
  CheckAppointmentConflictsQuery,
  ListAppointmentsQuery,
} from './appointment.queries';
import type { Appointment } from './appointment';

const emptyStringToNull = (value: string): string | null =>
  value === '' ? null : value;

const dateStringToDate = (value: string): Date | null =>
  value === '' ? null : new Date(value);

const optionalNullableStringToDto = (
  value: string | null | undefined,
): string | undefined => value ?? undefined;

const optionalNullableStringToUpdateDto = (
  value: string | null | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return '';

  return value;
};

const optionalDateToUpdateDto = (
  value: Date | null | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return '';

  return value.toISOString();
};

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

export const mapListAppointmentsQueryToDto = (
  query: ListAppointmentsQuery,
): ListAppointmentsQueryDto => ({
  page: query.page,
  limit: query.limit,
  startDate: query.startDate?.toISOString(),
  endDate: query.endDate?.toISOString(),
  doctorId: query.doctorId,
  status: query.status,
});

export const mapCheckAppointmentConflictsQueryToDto = (
  query: CheckAppointmentConflictsQuery,
): CheckAppointmentConflictsQueryDto => ({
  doctorId: query.doctorId,
  startAt: query.startAt.toISOString(),
  endAt: query.endAt.toISOString(),
  excludeStatus: query.excludeStatus,
  excludeAppointmentId: query.excludeAppointmentId,
});

export const mapCreateAppointmentCommandToDto = (
  command: CreateAppointmentCommand,
): CreateAppointmentRequestDto => ({
  patientId: command.patientId,
  patientName: command.patientName,
  patientPhone: optionalNullableStringToDto(command.patientPhone),
  doctorId: command.doctorId,
  doctorName: command.doctorName,
  startAt: command.startAt.toISOString(),
  endAt: command.endAt.toISOString(),
  isEmergency: command.isEmergency,
  type: optionalNullableStringToDto(command.type),
  channel: command.channel,
  status: command.status,
  notes: optionalNullableStringToDto(command.notes),
});

export const mapUpdateAppointmentCommandToDto = (
  command: UpdateAppointmentCommand,
): UpdateAppointmentRequestDto => ({
  patientId: command.patientId,
  patientName: command.patientName,
  patientPhone: optionalNullableStringToUpdateDto(command.patientPhone),
  doctorId: command.doctorId,
  doctorName: command.doctorName,
  startAt: command.startAt?.toISOString(),
  endAt: command.endAt?.toISOString(),
  isEmergency: command.isEmergency,
  type: optionalNullableStringToUpdateDto(command.type),
  channel: command.channel,
  status: command.status,
  notes: optionalNullableStringToUpdateDto(command.notes),
  cancelledAt: optionalDateToUpdateDto(command.cancelledAt),
  cancellationReason: optionalNullableStringToUpdateDto(
    command.cancellationReason,
  ),
});

export const mapRescheduleAppointmentCommandToDto = (
  command: RescheduleAppointmentCommand,
): UpdateAppointmentTimingRequestDto => ({
  doctorId: command.doctorId,
  doctorName: optionalNullableStringToDto(command.doctorName),
  newStartAt: command.newStartAt.toISOString(),
  newEndAt: command.newEndAt.toISOString(),
});

export const mapCancelAppointmentCommandToDto = (
  command: CancelAppointmentCommand,
): UpdateAppointmentRequestDto => ({
  status: 'CANCELLED',
  cancelledAt: command.cancelledAt.toISOString(),
  cancellationReason: optionalNullableStringToDto(command.cancellationReason),
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
