import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type {
  AppointmentReply,
  AppointmentsListReply,
  CheckAppointmentConflictsRequest,
  CheckInPatientRequest,
  ConflictReply,
  CreateAppointmentRequest,
  ListAppointmentsRequest,
  QueueEntriesListReply,
  QueueEntryReply,
  UpdateAppointmentRequest,
  UpdateAppointmentTimingRequest,
  UpdateQueueNotesRequest,
  UpdateQueueStatusRequest,
} from '@clinora/contracts-appointment';

import {
  APPOINTMENT_SERVICE_CLIENT,
  type AppointmentServiceClient,
} from '../../clients/appointment/appointment-service.client';

@Injectable()
export class AppointmentsFacade {
  constructor(
    @Inject(APPOINTMENT_SERVICE_CLIENT)
    private readonly appointmentsClient: AppointmentServiceClient,
  ) {}

  getAppointment(
    clinicId: string,
    appointmentId: string,
  ): Promise<AppointmentReply> {
    return this.executeScoped(clinicId, () =>
      this.appointmentsClient.getAppointment({ id: appointmentId }),
    );
  }

  listAppointments(
    request: ListAppointmentsRequest,
  ): Promise<AppointmentsListReply> {
    return this.execute(() =>
      this.appointmentsClient.listAppointments(request),
    );
  }

  createAppointment(
    request: CreateAppointmentRequest,
  ): Promise<AppointmentReply> {
    return this.execute(() =>
      this.appointmentsClient.createAppointment(request),
    );
  }

  async updateAppointment(
    clinicId: string,
    request: UpdateAppointmentRequest,
  ): Promise<AppointmentReply> {
    await this.assertAppointmentInClinic(clinicId, request.appointmentId);
    return this.execute(() =>
      this.appointmentsClient.updateAppointment(request),
    );
  }

  async updateAppointmentTiming(
    clinicId: string,
    request: UpdateAppointmentTimingRequest,
  ): Promise<AppointmentReply> {
    await this.assertAppointmentInClinic(clinicId, request.appointmentId);
    return this.execute(() =>
      this.appointmentsClient.updateAppointmentTiming(request),
    );
  }

  checkAppointmentConflicts(
    request: CheckAppointmentConflictsRequest,
  ): Promise<ConflictReply> {
    return this.execute(() =>
      this.appointmentsClient.checkAppointmentConflicts(request),
    );
  }

  listQueueEntries(
    request: { clinicId: string },
  ): Promise<QueueEntriesListReply> {
    return this.execute(() =>
      this.appointmentsClient.listQueueEntries(request),
    );
  }

  getQueueEntry(clinicId: string, queueEntryId: string): Promise<QueueEntryReply> {
    return this.executeScoped(clinicId, () =>
      this.appointmentsClient.getQueueEntry({ id: queueEntryId }),
    );
  }

  checkInPatient(request: CheckInPatientRequest): Promise<QueueEntryReply> {
    return this.execute(() => this.appointmentsClient.checkInPatient(request));
  }

  async updateQueueStatus(
    clinicId: string,
    request: UpdateQueueStatusRequest,
  ): Promise<QueueEntryReply> {
    await this.assertQueueEntryInClinic(clinicId, request.queueEntryId);
    return this.execute(() =>
      this.appointmentsClient.updateQueueStatus(request),
    );
  }

  async updateQueueNotes(
    clinicId: string,
    request: UpdateQueueNotesRequest,
  ): Promise<QueueEntryReply> {
    await this.assertQueueEntryInClinic(clinicId, request.queueEntryId);
    return this.execute(() =>
      this.appointmentsClient.updateQueueNotes(request),
    );
  }

  private async assertAppointmentInClinic(
    clinicId: string,
    appointmentId: string,
  ): Promise<void> {
    await this.executeScoped(clinicId, () =>
      this.appointmentsClient.getAppointment({ id: appointmentId }),
    );
  }

  private async assertQueueEntryInClinic(
    clinicId: string,
    queueEntryId: string,
  ): Promise<void> {
    await this.executeScoped(clinicId, () =>
      this.appointmentsClient.getQueueEntry({ id: queueEntryId }),
    );
  }

  private async executeScoped<T extends { clinicId: string }>(
    clinicId: string,
    call: () => Promise<T>,
  ): Promise<T> {
    const result = await this.execute(call);
    if (result.clinicId !== clinicId) {
      throw new ForbiddenException(
        "You do not have access to this clinic's resources",
      );
    }
    return result;
  }

  private async execute<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw mapAppointmentGrpcException(error);
    }
  }
}

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

function mapAppointmentGrpcException(error: unknown): HttpException {
  const grpcError = error as GrpcError;
  const message =
    grpcError.details ?? grpcError.message ?? 'Appointment request failed';

  switch (grpcError.code) {
    case status.INVALID_ARGUMENT:
      return new BadRequestException(message);
    case status.ALREADY_EXISTS:
      return new ConflictException(message);
    case status.NOT_FOUND:
      return new NotFoundException(message);
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return new ServiceUnavailableException('Appointment service unavailable');
    default:
      return new InternalServerErrorException('Appointment request failed');
  }
}
