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
  AssignWaitingRoomChairRequest,
  CreateWaitingRoomChairRequest,
  QueueEntriesListReply,
  QueueEntryReply,
  ReorderWaitingRoomEntriesRequest,
  UpdateQueueNotesRequest,
  UpdateWaitingRoomChairRequest,
  UpdateWaitingRoomStatusRequest,
  WaitingRoomChairReply,
  WaitingRoomChairsListReply,
  WaitingRoomStateReply,
} from '@clinora/contracts-appointment';

import {
  APPOINTMENT_SERVICE_CLIENT,
  type AppointmentServiceClient,
} from '../../clients/appointment/appointment-service.client';

@Injectable()
export class WaitingRoomFacade {
  constructor(
    @Inject(APPOINTMENT_SERVICE_CLIENT)
    private readonly appointmentsClient: AppointmentServiceClient,
  ) {}

  getState(clinicId: string): Promise<WaitingRoomStateReply> {
    return this.execute(() =>
      this.appointmentsClient.getWaitingRoomState({ clinicId }),
    );
  }

  updateStatus(
    request: UpdateWaitingRoomStatusRequest,
  ): Promise<QueueEntryReply> {
    return this.execute(() =>
      this.appointmentsClient.updateWaitingRoomStatus(request),
    );
  }

  async updateNotes(
    clinicId: string,
    request: UpdateQueueNotesRequest,
  ): Promise<QueueEntryReply> {
    await this.assertQueueEntryInClinic(clinicId, request.queueEntryId);

    return this.executeScoped(clinicId, () =>
      this.appointmentsClient.updateQueueNotes(request),
    );
  }

  assignChair(
    request: AssignWaitingRoomChairRequest,
  ): Promise<QueueEntryReply> {
    return this.execute(() =>
      this.appointmentsClient.assignWaitingRoomChair(request),
    );
  }

  reorderEntries(
    request: ReorderWaitingRoomEntriesRequest,
  ): Promise<QueueEntriesListReply> {
    return this.execute(() =>
      this.appointmentsClient.reorderWaitingRoomEntries(request),
    );
  }

  listChairs(clinicId: string): Promise<WaitingRoomChairsListReply> {
    return this.execute(() =>
      this.appointmentsClient.listWaitingRoomChairs({ clinicId }),
    );
  }

  createChair(
    request: CreateWaitingRoomChairRequest,
  ): Promise<WaitingRoomChairReply> {
    return this.execute(() =>
      this.appointmentsClient.createWaitingRoomChair(request),
    );
  }

  updateChair(
    request: UpdateWaitingRoomChairRequest,
  ): Promise<WaitingRoomChairReply> {
    return this.execute(() =>
      this.appointmentsClient.updateWaitingRoomChair(request),
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
      throw mapWaitingRoomGrpcException(error);
    }
  }
}

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

export function mapWaitingRoomGrpcException(error: unknown): HttpException {
  const grpcError = error as GrpcError;
  const message =
    grpcError.details ?? grpcError.message ?? 'Waiting room request failed';

  switch (grpcError.code) {
    case status.INVALID_ARGUMENT:
      return new BadRequestException(message);
    case status.ALREADY_EXISTS:
      return new ConflictException(message);
    case status.NOT_FOUND:
      return new NotFoundException(message);
    case status.PERMISSION_DENIED:
      return new ForbiddenException(message);
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return new ServiceUnavailableException('Appointment service unavailable');
    default:
      return new InternalServerErrorException('Waiting room request failed');
  }
}
