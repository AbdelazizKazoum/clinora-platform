import type { QueuePriority } from './appointment';

export interface CheckInAppointmentCommand {
  clinicId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  doctorId: string;
  doctorName: string;
  appointmentType?: string | null;
  priority?: QueuePriority;
  queueNotes?: string | null;
  arrivedAt?: Date;
}
