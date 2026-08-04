import type {
  AssignWaitingRoomChairRequestDto,
  CreateWaitingRoomChairRequestDto,
  QueueStreamChairDto,
  QueueStreamEntryDto,
  QueueStreamEventDto,
  ReorderWaitingRoomRequestDto,
  UpdateWaitingRoomChairRequestDto,
  UpdateWaitingRoomNotesRequestDto,
  UpdateWaitingRoomStatusRequestDto,
  WaitingRoomChairResponseDto,
  WaitingRoomChairsListResponseDto,
  WaitingRoomEntryResponseDto,
  WaitingRoomStateResponseDto,
} from '../api/dto';
import type {
  AssignWaitingRoomChairCommand,
  CreateWaitingRoomChairCommand,
  ReorderWaitingRoomCommand,
  UpdateWaitingRoomChairCommand,
  UpdateWaitingRoomNotesCommand,
  UpdateWaitingRoomStatusCommand,
} from './waiting-room.commands';
import type {
  WaitingRoomChair,
  WaitingRoomEntry,
  WaitingRoomQueueStreamEvent,
  WaitingRoomState,
} from './waiting-room';

const emptyStringToNull = (value: string): string | null =>
  value === '' ? null : value;

const optionalStringToNull = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;

  return value;
};

const optionalDateStringToDate = (
  value: string | null | undefined,
): Date | null => {
  if (!value) return null;

  return new Date(value);
};

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

export const mapWaitingRoomEntryFromDto = (
  dto: WaitingRoomEntryResponseDto,
): WaitingRoomEntry => ({
  id: dto.id,
  clinicId: dto.clinicId,
  appointmentId: dto.appointmentId,
  patientId: dto.patientId,
  patientName: dto.patientName,
  patientPhone: emptyStringToNull(dto.patientPhone),
  doctorId: dto.doctorId,
  doctorName: dto.doctorName,
  appointmentType: emptyStringToNull(dto.appointmentType),
  status: dto.status,
  priority: dto.priority,
  queueNotes: emptyStringToNull(dto.queueNotes),
  chairId: emptyStringToNull(dto.chairId),
  chairName: emptyStringToNull(dto.chairName),
  manualOrder: dto.manualOrder ?? null,
  arrivedAt: new Date(dto.arrivedAt),
  calledAt: optionalDateStringToDate(dto.calledAt),
  seatedAt: optionalDateStringToDate(dto.seatedAt),
  completedAt: optionalDateStringToDate(dto.completedAt),
  updatedAt: new Date(dto.updatedAt),
});

export const mapWaitingRoomChairFromDto = (
  dto: WaitingRoomChairResponseDto,
): WaitingRoomChair => ({
  id: dto.id,
  clinicId: dto.clinicId,
  name: dto.name,
  code: emptyStringToNull(dto.code),
  isActive: dto.isActive,
  isAvailable: dto.isAvailable,
  occupiedByEntryId: emptyStringToNull(dto.occupiedByEntryId),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const mapWaitingRoomStateFromDto = (
  dto: WaitingRoomStateResponseDto,
): WaitingRoomState => ({
  entries: (dto.entries ?? []).map(mapWaitingRoomEntryFromDto),
  chairs: (dto.chairs ?? []).map(mapWaitingRoomChairFromDto),
  ordering: {
    mode: dto.ordering.mode,
    manualStatuses: dto.ordering.manualStatuses ?? [],
  },
  generatedAt: new Date(dto.generatedAt),
});

export const mapWaitingRoomChairsListFromDto = (
  dto: WaitingRoomChairsListResponseDto,
): WaitingRoomChair[] => (dto.chairs ?? []).map(mapWaitingRoomChairFromDto);

export const mapQueueStreamEntryFromDto = (
  dto: QueueStreamEntryDto,
): WaitingRoomEntry => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  appointmentId: dto.appointment_id,
  patientId: dto.patient_id,
  patientName: dto.patient_name,
  patientPhone: optionalStringToNull(dto.patient_phone),
  doctorId: dto.doctor_id,
  doctorName: dto.doctor_name,
  appointmentType: optionalStringToNull(dto.appointment_type),
  status: dto.status,
  priority: dto.priority,
  queueNotes: optionalStringToNull(dto.queue_notes),
  chairId: optionalStringToNull(dto.chair_id),
  chairName: optionalStringToNull(dto.chair_name),
  manualOrder: dto.manual_order ?? null,
  arrivedAt: new Date(dto.arrived_at),
  calledAt: optionalDateStringToDate(dto.called_at),
  seatedAt: optionalDateStringToDate(dto.seated_at),
  completedAt: optionalDateStringToDate(dto.completed_at),
  updatedAt: new Date(dto.updated_at),
});

export const mapQueueStreamChairFromDto = (
  dto: QueueStreamChairDto,
): WaitingRoomChair => ({
  id: dto.id,
  clinicId: dto.clinic_id,
  name: dto.name,
  code: optionalStringToNull(dto.code),
  isActive: dto.is_active,
  isAvailable: dto.is_active,
  occupiedByEntryId: null,
  createdAt: new Date(dto.created_at),
  updatedAt: new Date(dto.updated_at),
});

export const mapQueueStreamEventFromDto = (
  dto: QueueStreamEventDto,
): WaitingRoomQueueStreamEvent => ({
  type: dto.type,
  clinicId: dto.clinic_id,
  entry: dto.entry ? mapQueueStreamEntryFromDto(dto.entry) : undefined,
  entries: dto.entries?.map(mapQueueStreamEntryFromDto),
  chair: dto.chair ? mapQueueStreamChairFromDto(dto.chair) : undefined,
  status: dto.status,
});

export const mapUpdateWaitingRoomStatusCommandToDto = (
  command: UpdateWaitingRoomStatusCommand,
): UpdateWaitingRoomStatusRequestDto => ({
  status: command.status,
  chairId: optionalNullableStringToDto(command.chairId),
  correctionReason: optionalNullableStringToDto(command.correctionReason),
  targetOrderedEntryIds: command.targetOrderedEntryIds,
});

export const mapUpdateWaitingRoomNotesCommandToDto = (
  command: UpdateWaitingRoomNotesCommand,
): UpdateWaitingRoomNotesRequestDto => ({
  queueNotes: optionalNullableStringToUpdateDto(command.queueNotes),
});

export const mapAssignWaitingRoomChairCommandToDto = (
  command: AssignWaitingRoomChairCommand,
): AssignWaitingRoomChairRequestDto => ({
  chairId: command.chairId,
});

export const mapReorderWaitingRoomCommandToDto = (
  command: ReorderWaitingRoomCommand,
): ReorderWaitingRoomRequestDto => ({
  mode: command.mode,
  status: command.status,
  orderedEntryIds: command.orderedEntryIds,
});

export const mapCreateWaitingRoomChairCommandToDto = (
  command: CreateWaitingRoomChairCommand,
): CreateWaitingRoomChairRequestDto => ({
  name: command.name,
  code: optionalNullableStringToDto(command.code),
  isActive: command.isActive,
});

export const mapUpdateWaitingRoomChairCommandToDto = (
  command: UpdateWaitingRoomChairCommand,
): UpdateWaitingRoomChairRequestDto => ({
  name: command.name,
  code: optionalNullableStringToUpdateDto(command.code),
  isActive: command.isActive,
});
