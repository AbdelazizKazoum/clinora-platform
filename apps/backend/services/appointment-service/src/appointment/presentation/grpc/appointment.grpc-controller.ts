import {Controller} from "@nestjs/common";
import {GrpcMethod} from "@nestjs/microservices";
import {
  APPOINTMENT_SERVICE_NAME,
  type AppointmentsListReply,
  type CheckAppointmentConflictsRequest,
  type CheckInPatientRequest,
  type ConflictReply,
  type CreateAppointmentRequest,
  type GetAppointmentRequest,
  type GetQueueEntryRequest,
  type ListAppointmentsRequest,
  type ListQueueEntriesRequest,
  type QueueEntriesListReply,
  type UpdateAppointmentRequest,
  type UpdateAppointmentTimingRequest,
  type UpdateQueueNotesRequest,
  type UpdateQueueStatusRequest,
} from "@clinora/contracts-appointment";
import {ManageAppointmentsUseCase} from "../../application/use-cases/manage-appointments.use-case";
import {ManageQueueUseCase} from "../../application/use-cases/manage-queue.use-case";
import {AppointmentStatus} from "../../domain/enums/appointment-status.enum";
import {BookingChannel} from "../../domain/enums/booking-channel.enum";
import {QueuePriority} from "../../domain/enums/queue-priority.enum";
import {QueueStatus} from "../../domain/enums/queue-status.enum";
import {AppointmentGrpcMapper} from "./appointment.grpc-mapper";
import {rethrowAsRpc} from "./rpc-error.helper";

@Controller()
export class AppointmentGrpcController {
  constructor(
    private readonly appointmentsUC: ManageAppointmentsUseCase,
    private readonly queueUC: ManageQueueUseCase,
  ) {}

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "GetAppointment")
  async getAppointment(data: GetAppointmentRequest) {
    try {
      const appointment = await this.appointmentsUC.getById(data.id);
      return AppointmentGrpcMapper.toAppointmentReply(appointment);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "ListAppointments")
  async listAppointments(
    data: ListAppointmentsRequest,
  ): Promise<AppointmentsListReply> {
    try {
      const result = await this.appointmentsUC.list({
        clinicId: data.clinicId,
        page: data.page,
        limit: data.limit,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        doctorId: data.doctorId || undefined,
        status: data.status as AppointmentStatus | undefined,
      });
      return {
        appointments: result.appointments.map(
          AppointmentGrpcMapper.toAppointmentReply,
        ),
        total: result.total,
      };
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "CreateAppointment")
  async createAppointment(data: CreateAppointmentRequest) {
    try {
      const appointment = await this.appointmentsUC.create({
        clinicId: data.clinicId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: data.patientPhone || null,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        isEmergency: data.isEmergency,
        type: data.type || null,
        channel: data.channel as BookingChannel,
        status: data.status
          ? (data.status as AppointmentStatus)
          : AppointmentStatus.PENDING,
        notes: data.notes || null,
        createdBy: data.createdBy || null,
      });
      return AppointmentGrpcMapper.toAppointmentReply(appointment);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "UpdateAppointment")
  async updateAppointment(data: UpdateAppointmentRequest) {
    try {
      const appointment = await this.appointmentsUC.update(data.appointmentId, {
        patientId: data.patientId || undefined,
        patientName: data.patientName || undefined,
        patientPhone: data.patientPhone ?? undefined,
        doctorId: data.doctorId || undefined,
        doctorName: data.doctorName || undefined,
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        isEmergency: data.isEmergency,
        type: data.type ?? undefined,
        channel: data.channel
          ? (data.channel as BookingChannel)
          : undefined,
        status: data.status ? (data.status as AppointmentStatus) : undefined,
        notes: data.notes ?? undefined,
        cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : undefined,
        cancellationReason: data.cancellationReason ?? undefined,
      });
      return AppointmentGrpcMapper.toAppointmentReply(appointment);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "UpdateAppointmentTiming")
  async updateAppointmentTiming(
    data: UpdateAppointmentTimingRequest,
  ) {
    try {
      const appointment = await this.appointmentsUC.updateTiming({
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
        doctorName: data.doctorName || undefined,
        newStartAt: new Date(data.newStartAt),
        newEndAt: new Date(data.newEndAt),
      });
      return AppointmentGrpcMapper.toAppointmentReply(appointment);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "CheckAppointmentConflicts")
  async checkAppointmentConflicts(
    data: CheckAppointmentConflictsRequest,
  ): Promise<ConflictReply> {
    try {
      return {
        hasConflict: await this.appointmentsUC.checkConflicts({
          clinicId: data.clinicId || undefined,
          doctorId: data.doctorId,
          startAt: new Date(data.startAt),
          endAt: new Date(data.endAt),
          excludeStatus: data.excludeStatus
            ? (data.excludeStatus as AppointmentStatus)
            : undefined,
          excludeAppointmentId: data.excludeAppointmentId || undefined,
        }),
      };
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "ListQueueEntries")
  async listQueueEntries(
    data: ListQueueEntriesRequest,
  ): Promise<QueueEntriesListReply> {
    try {
      const entries = await this.queueUC.listByClinic(data.clinicId);
      return {queueEntries: entries.map(AppointmentGrpcMapper.toQueueEntryReply)};
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "GetQueueEntry")
  async getQueueEntry(data: GetQueueEntryRequest) {
    try {
      const entry = await this.queueUC.getById(data.id);
      return AppointmentGrpcMapper.toQueueEntryReply(entry);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "CheckInPatient")
  async checkInPatient(data: CheckInPatientRequest) {
    try {
      const entry = await this.queueUC.checkIn({
        clinicId: data.clinicId,
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: data.patientPhone || null,
        doctorId: data.doctorId,
        doctorName: data.doctorName,
        appointmentType: data.appointmentType || null,
        priority: data.priority
          ? (data.priority as QueuePriority)
          : QueuePriority.NORMAL,
        notes: data.queueNotes || null,
        arrivedAt: data.arrivedAt ? new Date(data.arrivedAt) : undefined,
      });
      return AppointmentGrpcMapper.toQueueEntryReply(entry);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "UpdateQueueStatus")
  async updateQueueStatus(data: UpdateQueueStatusRequest) {
    try {
      const entry = await this.queueUC.updateStatus(
        data.queueEntryId,
        data.status as QueueStatus,
        data.correctionReason || undefined,
      );
      return AppointmentGrpcMapper.toQueueEntryReply(entry);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }

  @GrpcMethod(APPOINTMENT_SERVICE_NAME, "UpdateQueueNotes")
  async updateQueueNotes(data: UpdateQueueNotesRequest) {
    try {
      const entry = await this.queueUC.updateNotes(
        data.queueEntryId,
        data.queueNotes ?? null,
      );
      return AppointmentGrpcMapper.toQueueEntryReply(entry);
    } catch (error) {
      rethrowAsRpc(error);
    }
  }
}
