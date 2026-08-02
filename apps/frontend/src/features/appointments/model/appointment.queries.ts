import type { AppointmentStatus } from './appointment';
import type { Appointment } from './appointment';

export interface ListAppointmentsQuery {
  clinicId: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  status?: AppointmentStatus;
}

export interface ListAppointmentsResult {
  appointments: Appointment[];
  total: number;
}

export interface GetAppointmentQuery {
  clinicId: string;
  appointmentId: string;
}

export interface CheckAppointmentConflictsQuery {
  clinicId: string;
  doctorId: string;
  startAt: Date;
  endAt: Date;
  excludeStatus?: AppointmentStatus;
  excludeAppointmentId?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
}
