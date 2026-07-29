import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import type {
  ClinicServiceClient as GrpcClinicServiceContractClient,
  CreateStaffMemberRequest,
  GetStaffMemberRequest,
  ListStaffMembersRequest,
  StaffMemberReply,
  StaffMembersReply,
  UpdateStaffMemberRequest,
} from '@clinora/contracts-clinic';
import { CLINIC_SERVICE_NAME } from '@clinora/contracts-clinic';

import {
  CLINIC_GRPC_CLIENT,
  type ClinicServiceClient,
} from './clinic-service.client';

@Injectable()
export class GrpcClinicServiceClient
  implements ClinicServiceClient, OnModuleInit
{
  private service?: GrpcClinicServiceContractClient;

  constructor(
    @Inject(CLINIC_GRPC_CLIENT)
    private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.service =
      this.grpcClient.getService<GrpcClinicServiceContractClient>(
        CLINIC_SERVICE_NAME,
      );
  }

  getStaffMember(
    request: GetStaffMemberRequest,
  ): Promise<StaffMemberReply> {
    return lastValueFrom(this.getService().getStaffMember(request));
  }

  listStaffMembers(
    request: ListStaffMembersRequest,
  ): Promise<StaffMembersReply> {
    return lastValueFrom(this.getService().listStaffMembers(request));
  }

  createStaffMember(
    request: CreateStaffMemberRequest,
  ): Promise<StaffMemberReply> {
    return lastValueFrom(this.getService().createStaffMember(request));
  }

  updateStaffMember(
    request: UpdateStaffMemberRequest,
  ): Promise<StaffMemberReply> {
    return lastValueFrom(this.getService().updateStaffMember(request));
  }

  private getService(): GrpcClinicServiceContractClient {
    if (!this.service) {
      throw new Error('Clinic gRPC service has not been initialized');
    }
    return this.service;
  }
}
