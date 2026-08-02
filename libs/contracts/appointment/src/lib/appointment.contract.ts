import { resolve } from 'node:path';

import type { Observable } from 'rxjs';

export const APPOINTMENT_PACKAGE_NAME = 'appointment';
export const APPOINTMENT_SERVICE_NAME = 'AppointmentService';

export const APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'NO_SHOW',
  'COMPLETED',
] as const;
export const BOOKING_CHANNELS = ['ONLINE', 'WALK_IN', 'PHONE'] as const;
export const QUEUE_PRIORITIES = ['NORMAL', 'URGENT', 'EMERGENCY'] as const;
export const QUEUE_STATUSES = [
  'ARRIVED',
  'WAITING',
  'IN_CHAIR',
  'DONE',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];
export type QueuePriority = (typeof QUEUE_PRIORITIES)[number];
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export function resolveAppointmentProtoPath(): string {
  return resolve(
    process.env['APPOINTMENT_PROTO_PATH'] ??
      'libs/contracts/appointment/src/lib/appointment.proto',
  );
}

export interface AppointmentReply {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  startAt: string;
  endAt: string;
  isEmergency: boolean;
  type: string;
  channel: string;
  status: string;
  notes: string;
  cancelledAt: string;
  cancellationReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsListReply {
  appointments: AppointmentReply[];
  total: number;
}

export interface GetAppointmentRequest {
  id: string;
}

export interface ListAppointmentsRequest {
  clinicId: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  status?: AppointmentStatus;
}

export interface CreateAppointmentRequest {
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  startAt: string;
  endAt: string;
  isEmergency: boolean;
  type?: string;
  channel: BookingChannel;
  status?: AppointmentStatus;
  notes?: string;
  createdBy?: string;
}

export interface UpdateAppointmentRequest {
  appointmentId: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  startAt?: string;
  endAt?: string;
  isEmergency?: boolean;
  type?: string;
  channel?: BookingChannel;
  status?: AppointmentStatus;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface UpdateAppointmentTimingRequest {
  appointmentId: string;
  doctorId: string;
  doctorName?: string;
  newStartAt: string;
  newEndAt: string;
}

export interface CheckAppointmentConflictsRequest {
  clinicId?: string;
  doctorId: string;
  startAt: string;
  endAt: string;
  excludeStatus?: AppointmentStatus;
  excludeAppointmentId?: string;
}

export interface ConflictReply {
  hasConflict: boolean;
}

export interface QueueEntryReply {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentType: string;
  status: string;
  priority: string;
  queueNotes: string;
  arrivedAt: string;
  calledAt: string;
  seatedAt: string;
  completedAt: string;
  updatedAt: string;
}

export interface QueueEntriesListReply {
  queueEntries: QueueEntryReply[];
}

export interface ListQueueEntriesRequest {
  clinicId: string;
}

export interface GetQueueEntryRequest {
  id: string;
}

export interface CheckInPatientRequest {
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  appointmentType?: string;
  priority?: QueuePriority;
  queueNotes?: string;
  arrivedAt?: string;
}

export interface UpdateQueueStatusRequest {
  queueEntryId: string;
  status: QueueStatus;
  correctionReason?: string;
}

export interface UpdateQueueNotesRequest {
  queueEntryId: string;
  queueNotes?: string;
}

export interface AppointmentServiceClient {
  getAppointment(
    request: GetAppointmentRequest,
  ): Observable<AppointmentReply>;
  listAppointments(
    request: ListAppointmentsRequest,
  ): Observable<AppointmentsListReply>;
  createAppointment(
    request: CreateAppointmentRequest,
  ): Observable<AppointmentReply>;
  updateAppointment(
    request: UpdateAppointmentRequest,
  ): Observable<AppointmentReply>;
  updateAppointmentTiming(
    request: UpdateAppointmentTimingRequest,
  ): Observable<AppointmentReply>;
  checkAppointmentConflicts(
    request: CheckAppointmentConflictsRequest,
  ): Observable<ConflictReply>;
  listQueueEntries(
    request: ListQueueEntriesRequest,
  ): Observable<QueueEntriesListReply>;
  getQueueEntry(request: GetQueueEntryRequest): Observable<QueueEntryReply>;
  checkInPatient(
    request: CheckInPatientRequest,
  ): Observable<QueueEntryReply>;
  updateQueueStatus(
    request: UpdateQueueStatusRequest,
  ): Observable<QueueEntryReply>;
  updateQueueNotes(
    request: UpdateQueueNotesRequest,
  ): Observable<QueueEntryReply>;
}
