import {Appointment} from "../entities/appointment";
import {AppointmentStatus} from "../enums/appointment-status.enum";
import {BookingChannel} from "../enums/booking-channel.enum";

export interface CreateAppointmentInput {
  clinicId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string | null;
  doctorId: string;
  doctorName: string;
  startAt: Date;
  endAt: Date;
  isEmergency: boolean;
  type?: string | null;
  channel: BookingChannel;
  status?: AppointmentStatus;
  notes?: string | null;
  createdBy?: string | null;
}

export interface UpdateAppointmentInput {
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

export interface ListAppointmentsQuery {
  clinicId: string;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  doctorId?: string;
  status?: AppointmentStatus;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
}

export interface IAppointmentRepository {
  create(input: CreateAppointmentInput): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findMany(query: ListAppointmentsQuery): Promise<AppointmentListResponse>;
  update(id: string, input: UpdateAppointmentInput): Promise<Appointment>;
  checkConflicts(input: {
    clinicId?: string;
    doctorId: string;
    startAt: Date;
    endAt: Date;
    excludeStatus?: AppointmentStatus;
    excludeAppointmentId?: string;
  }): Promise<boolean>;
}
