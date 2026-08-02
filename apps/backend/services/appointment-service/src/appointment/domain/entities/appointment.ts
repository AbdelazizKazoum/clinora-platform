import {AppointmentStatus} from "../enums/appointment-status.enum";
import {BookingChannel} from "../enums/booking-channel.enum";

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly clinicId: string,
    public readonly patientId: string,
    public readonly patientName: string,
    public readonly patientPhone: string | null,
    public readonly doctorId: string,
    public readonly doctorName: string,
    public readonly startAt: Date,
    public readonly endAt: Date,
    public readonly isEmergency: boolean,
    public readonly type: string | null,
    public readonly channel: BookingChannel,
    public readonly status: AppointmentStatus,
    public readonly notes: string | null,
    public readonly cancelledAt: Date | null,
    public readonly cancellationReason: string | null,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
