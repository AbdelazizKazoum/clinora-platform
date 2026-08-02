import type { AppointmentStatus } from '../../model/appointment';

export interface ListAppointmentsQueryDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  status?: AppointmentStatus;
}

export interface CheckAppointmentConflictsQueryDto {
  doctorId: string;
  startAt: string;
  endAt: string;
  excludeStatus?: AppointmentStatus;
  excludeAppointmentId?: string;
}
