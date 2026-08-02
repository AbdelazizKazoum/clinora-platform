import {QueueEntry} from "../entities/queue-entry";
import {QueuePriority} from "../enums/queue-priority.enum";
import {QueueStatus} from "../enums/queue-status.enum";

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

export interface IQueueRepository {
  create(input: CheckInPatientInput): Promise<QueueEntry>;
  findById(id: string): Promise<QueueEntry | null>;
  findByAppointmentId(appointmentId: string): Promise<QueueEntry | null>;
  listByClinic(clinicId: string): Promise<QueueEntry[]>;
  updateStatus(
    id: string,
    status: QueueStatus,
    correctionReason?: string,
  ): Promise<QueueEntry>;
  updateNotes(id: string, notes?: string | null): Promise<QueueEntry>;
}
