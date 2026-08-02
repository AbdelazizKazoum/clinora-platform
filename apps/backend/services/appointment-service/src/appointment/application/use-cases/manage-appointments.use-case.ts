import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AppointmentListResponse,
  CreateAppointmentInput,
  IAppointmentRepository,
  ListAppointmentsQuery,
  UpdateAppointmentInput,
} from "../../domain/repositories/appointment-repository.interface";
import {Appointment} from "../../domain/entities/appointment";
import {AppointmentStatus} from "../../domain/enums/appointment-status.enum";
import {
  APPOINTMENT_REPOSITORY,
  OUTBOX_REPOSITORY,
  CLINIC_SERVICE_PORT,
  PATIENT_SERVICE_PORT,
} from "../../appointment.tokens";
import {IOutboxRepository} from "../../domain/repositories/outbox-repository.interface";
import {ClinicServicePort} from "../ports/clinic-service.port";
import {PatientServicePort} from "../ports/patient-service.port";

@Injectable()
export class ManageAppointmentsUseCase {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outbox: IOutboxRepository,
    @Inject(PATIENT_SERVICE_PORT)
    private readonly patients: PatientServicePort,
    @Inject(CLINIC_SERVICE_PORT)
    private readonly clinic: ClinicServicePort,
  ) {}

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    await this.validateSnapshots(input);
    if (!input.isEmergency) {
      const hasConflict = await this.appointments.checkConflicts({
        clinicId: input.clinicId,
        doctorId: input.doctorId,
        startAt: input.startAt,
        endAt: input.endAt,
      });
      if (hasConflict) {
        throw new ConflictException("Doctor already has an appointment in this slot");
      }
    }

    const created = await this.appointments.create(input);
    await this.outbox.add({
      eventType: "appointment.created",
      payload: this.appointmentPayload(created),
    });
    return created;
  }

  async getById(id: string): Promise<Appointment> {
    const appointment = await this.appointments.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Appointment \"${id}\" not found`);
    }
    return appointment;
  }

  list(query: ListAppointmentsQuery): Promise<AppointmentListResponse> {
    return this.appointments.findMany(query);
  }

  async update(id: string, input: UpdateAppointmentInput): Promise<Appointment> {
    const existing = await this.getById(id);
    const nextDoctorId = input.doctorId ?? existing.doctorId;
    const nextStartAt = input.startAt ?? existing.startAt;
    const nextEndAt = input.endAt ?? existing.endAt;
    const nextEmergency = input.isEmergency ?? existing.isEmergency;

    if (input.doctorId || input.doctorName) {
      await this.validateDoctor(nextDoctorId, existing.clinicId);
    }
    if (!nextEmergency && (input.doctorId || input.startAt || input.endAt)) {
      const hasConflict = await this.appointments.checkConflicts({
        clinicId: existing.clinicId,
        doctorId: nextDoctorId,
        startAt: nextStartAt,
        endAt: nextEndAt,
        excludeAppointmentId: id,
      });
      if (hasConflict) {
        throw new ConflictException("Doctor already has an appointment in this slot");
      }
    }

    const updated = await this.appointments.update(id, input);
    await this.outbox.add({
      eventType: "appointment.updated",
      payload: this.appointmentPayload(updated),
    });
    return updated;
  }

  async updateTiming(input: {
    appointmentId: string;
    doctorId: string;
    doctorName?: string;
    newStartAt: Date;
    newEndAt: Date;
  }): Promise<Appointment> {
    const existing = await this.getById(input.appointmentId);
    await this.validateDoctor(input.doctorId, existing.clinicId);

    if (!existing.isEmergency) {
      const hasConflict = await this.appointments.checkConflicts({
        clinicId: existing.clinicId,
        doctorId: input.doctorId,
        startAt: input.newStartAt,
        endAt: input.newEndAt,
        excludeAppointmentId: input.appointmentId,
      });
      if (hasConflict) {
        throw new ConflictException("Doctor already has an appointment in this slot");
      }
    }

    const updated = await this.appointments.update(input.appointmentId, {
      doctorId: input.doctorId,
      ...(input.doctorName ? {doctorName: input.doctorName} : {}),
      startAt: input.newStartAt,
      endAt: input.newEndAt,
    });
    await this.outbox.add({
      eventType: "appointment.timing.updated",
      payload: this.appointmentPayload(updated),
    });
    return updated;
  }

  checkConflicts(input: {
    clinicId?: string;
    doctorId: string;
    startAt: Date;
    endAt: Date;
    excludeStatus?: AppointmentStatus;
    excludeAppointmentId?: string;
  }): Promise<boolean> {
    return this.appointments.checkConflicts(input);
  }

  private async validateSnapshots(input: CreateAppointmentInput): Promise<void> {
    const patient = await this.patients.getPatient(
      input.patientId,
      input.clinicId,
    );
    if (patient.clinicId !== input.clinicId) {
      throw new BadRequestException("Patient does not belong to this clinic");
    }
    await this.validateDoctor(input.doctorId, input.clinicId);
  }

  private async validateDoctor(userId: string, clinicId: string): Promise<void> {
    const staff = await this.clinic.getStaffMember(userId, clinicId);
    if (staff.clinicId !== clinicId || staff.role.toUpperCase() !== "DOCTOR") {
      throw new BadRequestException("Doctor does not belong to this clinic");
    }
  }

  private appointmentPayload(appointment: Appointment): Record<string, unknown> {
    return {
      id: appointment.id,
      clinic_id: appointment.clinicId,
      patient_id: appointment.patientId,
      doctor_id: appointment.doctorId,
      status: appointment.status,
      start_at: appointment.startAt.toISOString(),
      end_at: appointment.endAt.toISOString(),
    };
  }
}
