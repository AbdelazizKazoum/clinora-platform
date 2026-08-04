import type {
  AppointmentReply,
  AppointmentsListReply,
  AssignWaitingRoomChairRequest,
  CheckAppointmentConflictsRequest,
  CheckInPatientRequest,
  ConflictReply,
  CreateAppointmentRequest,
  CreateWaitingRoomChairRequest,
  GetAppointmentRequest,
  GetQueueEntryRequest,
  GetWaitingRoomStateRequest,
  ListAppointmentsRequest,
  ListQueueEntriesRequest,
  ListWaitingRoomChairsRequest,
  QueueEntriesListReply,
  QueueEntryReply,
  ReorderWaitingRoomEntriesRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentTimingRequest,
  UpdateQueueNotesRequest,
  UpdateQueueStatusRequest,
  UpdateWaitingRoomChairRequest,
  UpdateWaitingRoomStatusRequest,
  WaitingRoomChairReply,
  WaitingRoomChairsListReply,
  WaitingRoomStateReply,
} from '@clinora/contracts-appointment';

export const APPOINTMENT_SERVICE_CLIENT = Symbol('APPOINTMENT_SERVICE_CLIENT');
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
  getWaitingRoomState(
    request: GetWaitingRoomStateRequest,
  ): Promise<WaitingRoomStateReply>;
  updateWaitingRoomStatus(
    request: UpdateWaitingRoomStatusRequest,
  ): Promise<QueueEntryReply>;
  assignWaitingRoomChair(
    request: AssignWaitingRoomChairRequest,
  ): Promise<QueueEntryReply>;
  reorderWaitingRoomEntries(
    request: ReorderWaitingRoomEntriesRequest,
  ): Promise<QueueEntriesListReply>;
  listWaitingRoomChairs(
    request: ListWaitingRoomChairsRequest,
  ): Promise<WaitingRoomChairsListReply>;
  createWaitingRoomChair(
    request: CreateWaitingRoomChairRequest,
  ): Promise<WaitingRoomChairReply>;
  updateWaitingRoomChair(
    request: UpdateWaitingRoomChairRequest,
  ): Promise<WaitingRoomChairReply>;
}
