import { QueueEntry } from '../entities/queue-entry';
import { QueuePriority } from '../enums/queue-priority.enum';
import { QueueStatus } from '../enums/queue-status.enum';

export interface CheckInPatientInput {
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  doctorId: string;
  doctorName: string;
  appointmentType?: string | null;
  priority?: QueuePriority;
  notes?: string | null;
  arrivedAt?: Date;
}

export interface UpdateWaitingRoomStatusInput {
  id: string;
  status: QueueStatus;
  correctionReason?: string;
  chairId?: string | null;
  chairName?: string | null;
}

export interface AssignQueueChairInput {
  id: string;
  chairId: string;
  chairName: string;
}

export interface ReorderQueueEntriesInput {
  clinicId: string;
  status: QueueStatus;
  orderedEntryIds: string[];
}

export interface ClearQueueManualOrderInput {
  clinicId: string;
  status?: QueueStatus;
}

export interface IQueueRepository {
  create(input: CheckInPatientInput): Promise<QueueEntry>;
  findById(id: string): Promise<QueueEntry | null>;
  findByAppointmentId(appointmentId: string): Promise<QueueEntry | null>;
  findInChairByChairId(
    clinicId: string,
    chairId: string,
    excludeEntryId?: string,
  ): Promise<QueueEntry | null>;
  listByClinic(clinicId: string): Promise<QueueEntry[]>;
  updateStatus(
    id: string,
    status: QueueStatus,
    correctionReason?: string,
  ): Promise<QueueEntry>;
  updateWaitingRoomStatus(
    input: UpdateWaitingRoomStatusInput,
  ): Promise<QueueEntry>;
  assignChair(input: AssignQueueChairInput): Promise<QueueEntry>;
  reorderStatus(input: ReorderQueueEntriesInput): Promise<QueueEntry[]>;
  clearManualOrder(input: ClearQueueManualOrderInput): Promise<QueueEntry[]>;
  updateNotes(id: string, notes?: string | null): Promise<QueueEntry>;
}
