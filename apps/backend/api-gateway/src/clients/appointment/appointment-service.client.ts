import type {
  AppointmentReply,
  AppointmentsListReply,
  CheckAppointmentConflictsRequest,
  CheckInPatientRequest,
  ConflictReply,
  CreateAppointmentRequest,
  GetAppointmentRequest,
  GetQueueEntryRequest,
  ListAppointmentsRequest,
  ListQueueEntriesRequest,
  QueueEntriesListReply,
  QueueEntryReply,
  UpdateAppointmentRequest,
  UpdateAppointmentTimingRequest,
  UpdateQueueNotesRequest,
  UpdateQueueStatusRequest,
} from '@clinora/contracts-appointment';

export const APPOINTMENT_SERVICE_CLIENT = Symbol(
  'APPOINTMENT_SERVICE_CLIENT',
);
export const APPOINTMENT_GRPC_CLIENT = Symbol('APPOINTMENT_GRPC_CLIENT');

export interface AppointmentServiceClient {
  getAppointment(request: GetAppointmentRequest): Promise<AppointmentReply>;
  listAppointments(
    request: ListAppointmentsRequest,
  ): Promise<AppointmentsListReply>;
  createAppointment(
    request: CreateAppointmentRequest,
  ): Promise<AppointmentReply>;
  updateAppointment(
    request: UpdateAppointmentRequest,
  ): Promise<AppointmentReply>;
  updateAppointmentTiming(
    request: UpdateAppointmentTimingRequest,
  ): Promise<AppointmentReply>;
  checkAppointmentConflicts(
    request: CheckAppointmentConflictsRequest,
  ): Promise<ConflictReply>;
  listQueueEntries(
    request: ListQueueEntriesRequest,
  ): Promise<QueueEntriesListReply>;
  getQueueEntry(request: GetQueueEntryRequest): Promise<QueueEntryReply>;
  checkInPatient(request: CheckInPatientRequest): Promise<QueueEntryReply>;
  updateQueueStatus(
    request: UpdateQueueStatusRequest,
  ): Promise<QueueEntryReply>;
  updateQueueNotes(request: UpdateQueueNotesRequest): Promise<QueueEntryReply>;
}
