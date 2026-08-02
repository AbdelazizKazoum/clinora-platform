import type { QueuePriority, QueueStatus } from '../../model/appointment';

export interface QueueEntryResponseDto {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  appointmentType: string;
  status: QueueStatus;
  priority: QueuePriority;
  queueNotes: string;
  arrivedAt: string;
  calledAt: string;
  seatedAt: string;
  completedAt: string;
  updatedAt: string;
}

export interface QueueEntriesListResponseDto {
  queueEntries: QueueEntryResponseDto[];
}
