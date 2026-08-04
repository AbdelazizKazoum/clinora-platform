import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import type {
  AppointmentReply,
  AppointmentServiceClient as GrpcAppointmentServiceContractClient,
  AppointmentsListReply,
  AssignWaitingRoomChairRequest,
  CheckAppointmentConflictsRequest,
  CheckInPatientRequest,
  ConflictReply,
  CreateAppointmentRequest,
  CreateWaitingRoomChairRequest,
  GetAppointmentRequest,
  GetQueueEntryRequest,
  GetWaitingRoomStateRequest,
  ListAppointmentsRequest,
  ListQueueEntriesRequest,
  ListWaitingRoomChairsRequest,
  QueueEntriesListReply,
  QueueEntryReply,
  ReorderWaitingRoomEntriesRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentTimingRequest,
  UpdateQueueNotesRequest,
  UpdateQueueStatusRequest,
  UpdateWaitingRoomChairRequest,
  UpdateWaitingRoomStatusRequest,
  WaitingRoomChairReply,
  WaitingRoomChairsListReply,
  WaitingRoomStateReply,
} from '@clinora/contracts-appointment';
import { APPOINTMENT_SERVICE_NAME } from '@clinora/contracts-appointment';

import {
  APPOINTMENT_GRPC_CLIENT,
  type AppointmentServiceClient,
} from './appointment-service.client';

@Injectable()
export class GrpcAppointmentServiceClient
  implements AppointmentServiceClient, OnModuleInit
{
  private service?: GrpcAppointmentServiceContractClient;

  constructor(
    @Inject(APPOINTMENT_GRPC_CLIENT)
    private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.service =
      this.grpcClient.getService<GrpcAppointmentServiceContractClient>(
        APPOINTMENT_SERVICE_NAME,
      );
  }

  getAppointment(request: GetAppointmentRequest): Promise<AppointmentReply> {
    return lastValueFrom(this.getService().getAppointment(request));
  }

  listAppointments(
    request: ListAppointmentsRequest,
  ): Promise<AppointmentsListReply> {
    return lastValueFrom(this.getService().listAppointments(request));
  }

  createAppointment(
    request: CreateAppointmentRequest,
  ): Promise<AppointmentReply> {
    return lastValueFrom(this.getService().createAppointment(request));
  }

  updateAppointment(
    request: UpdateAppointmentRequest,
  ): Promise<AppointmentReply> {
    return lastValueFrom(this.getService().updateAppointment(request));
  }

  updateAppointmentTiming(
    request: UpdateAppointmentTimingRequest,
  ): Promise<AppointmentReply> {
    return lastValueFrom(this.getService().updateAppointmentTiming(request));
  }

  checkAppointmentConflicts(
    request: CheckAppointmentConflictsRequest,
  ): Promise<ConflictReply> {
    return lastValueFrom(this.getService().checkAppointmentConflicts(request));
  }

  listQueueEntries(
    request: ListQueueEntriesRequest,
  ): Promise<QueueEntriesListReply> {
    return lastValueFrom(this.getService().listQueueEntries(request));
  }

  getQueueEntry(request: GetQueueEntryRequest): Promise<QueueEntryReply> {
    return lastValueFrom(this.getService().getQueueEntry(request));
  }

  checkInPatient(request: CheckInPatientRequest): Promise<QueueEntryReply> {
    return lastValueFrom(this.getService().checkInPatient(request));
  }

  updateQueueStatus(
    request: UpdateQueueStatusRequest,
  ): Promise<QueueEntryReply> {
    return lastValueFrom(this.getService().updateQueueStatus(request));
  }

  updateQueueNotes(request: UpdateQueueNotesRequest): Promise<QueueEntryReply> {
    return lastValueFrom(this.getService().updateQueueNotes(request));
  }

  getWaitingRoomState(
    request: GetWaitingRoomStateRequest,
  ): Promise<WaitingRoomStateReply> {
    return lastValueFrom(this.getService().getWaitingRoomState(request));
  }

  updateWaitingRoomStatus(
    request: UpdateWaitingRoomStatusRequest,
  ): Promise<QueueEntryReply> {
    return lastValueFrom(this.getService().updateWaitingRoomStatus(request));
  }

  assignWaitingRoomChair(
    request: AssignWaitingRoomChairRequest,
  ): Promise<QueueEntryReply> {
    return lastValueFrom(this.getService().assignWaitingRoomChair(request));
  }

  reorderWaitingRoomEntries(
    request: ReorderWaitingRoomEntriesRequest,
  ): Promise<QueueEntriesListReply> {
    return lastValueFrom(this.getService().reorderWaitingRoomEntries(request));
  }

  listWaitingRoomChairs(
    request: ListWaitingRoomChairsRequest,
  ): Promise<WaitingRoomChairsListReply> {
    return lastValueFrom(this.getService().listWaitingRoomChairs(request));
  }

  createWaitingRoomChair(
    request: CreateWaitingRoomChairRequest,
  ): Promise<WaitingRoomChairReply> {
    return lastValueFrom(this.getService().createWaitingRoomChair(request));
  }

  updateWaitingRoomChair(
    request: UpdateWaitingRoomChairRequest,
  ): Promise<WaitingRoomChairReply> {
    return lastValueFrom(this.getService().updateWaitingRoomChair(request));
  }

  private getService(): GrpcAppointmentServiceContractClient {
    if (!this.service) {
      throw new Error('Appointment gRPC client has not been initialized');
    }
    return this.service;
  }
}
