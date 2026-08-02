import type {
  AppointmentStatus,
  BookingChannel,
  QueuePriority,
} from './appointment';

export interface CreateAppointmentCommand {
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  doctorId: string;
  doctorName: string;
  startAt: Date;
  endAt: Date;
  isEmergency?: boolean;
  type?: string | null;
  channel?: BookingChannel;
  status?: AppointmentStatus;
  notes?: string | null;
}

export interface UpdateAppointmentCommand {
  clinicId: string;
  appointmentId: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string | null;
  doctorId?: string;
  doctorName?: string;
  startAt?: Date;
  endAt?: Date;
  isEmergency?: boolean;
  type?: string | null;
  channel?: BookingChannel;
  status?: AppointmentStatus;
  notes?: string | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
}

export interface RescheduleAppointmentCommand {
  clinicId: string;
  appointmentId: string;
  doctorId: string;
  doctorName?: string | null;
  newStartAt: Date;
  newEndAt: Date;
}

export interface CancelAppointmentCommand {
  clinicId: string;
  appointmentId: string;
  cancelledAt: Date;
  cancellationReason?: string | null;
}

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
