import type { AppointmentStatus, BookingChannel } from '../../model/appointment';

export interface AppointmentResponseDto {
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
  channel: BookingChannel;
  status: AppointmentStatus;
  notes: string;
  cancelledAt: string;
  cancellationReason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentsListResponseDto {
  appointments?: AppointmentResponseDto[];
  total?: number;
}

export interface ConflictResponseDto {
  hasConflict: boolean;
}
