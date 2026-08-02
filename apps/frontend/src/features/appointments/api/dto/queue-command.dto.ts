import type { QueuePriority, QueueStatus } from '../../model/appointment';

export interface CheckInPatientRequestDto {
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

export interface UpdateQueueStatusRequestDto {
  status: QueueStatus;
  correctionReason?: string;
}

export interface UpdateQueueNotesRequestDto {
  queueNotes?: string;
}
