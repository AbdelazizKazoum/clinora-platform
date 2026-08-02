import type { AppointmentStatus, BookingChannel } from '../../model/appointment';

export interface CreateAppointmentRequestDto {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  startAt: string;
  endAt: string;
  isEmergency?: boolean;
  type?: string;
  channel?: BookingChannel;
  status?: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentRequestDto {
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

export interface UpdateAppointmentTimingRequestDto {
  doctorId: string;
  doctorName?: string;
  newStartAt: string;
  newEndAt: string;
}
