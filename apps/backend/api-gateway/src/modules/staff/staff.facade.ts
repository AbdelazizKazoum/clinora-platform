import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type {
  CreateStaffMemberRequest,
  GetStaffMemberRequest,
  ListStaffMembersRequest,
  StaffMemberReply,
  StaffMembersReply,
  UpdateStaffMemberRequest,
} from '@clinora/contracts-clinic';

import {
  CLINIC_SERVICE_CLIENT,
  type ClinicServiceClient,
} from '../../clients/clinic/clinic-service.client';

@Injectable()
export class StaffFacade {
  constructor(
    @Inject(CLINIC_SERVICE_CLIENT)
    private readonly clinicClient: ClinicServiceClient,
  ) {}

  getStaffMember(
    request: GetStaffMemberRequest,
  ): Promise<StaffMemberReply> {
    return this.execute(() => this.clinicClient.getStaffMember(request));
  }

  listStaffMembers(
    request: ListStaffMembersRequest,
  ): Promise<StaffMembersReply> {
    return this.execute(() => this.clinicClient.listStaffMembers(request));
  }

  createStaffMember(
    request: CreateStaffMemberRequest,
  ): Promise<StaffMemberReply> {
    return this.execute(() => this.clinicClient.createStaffMember(request));
  }

  updateStaffMember(
    request: UpdateStaffMemberRequest,
  ): Promise<StaffMemberReply> {
    return this.execute(() => this.clinicClient.updateStaffMember(request));
  }

  private async execute<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error: unknown) {
      throw mapClinicGrpcException(error);
    }
  }
}

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

export function mapClinicGrpcException(error: unknown): HttpException {
  const grpcError = error as GrpcError;
  const message =
    grpcError.details ?? grpcError.message ?? 'Clinic request failed';

  switch (grpcError.code) {
    case status.INVALID_ARGUMENT:
      return new BadRequestException(message);
    case status.ALREADY_EXISTS:
      return new ConflictException(message);
    case status.NOT_FOUND:
      return new NotFoundException(message);
    case status.FAILED_PRECONDITION:
      return new PreconditionFailedException(message);
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return new ServiceUnavailableException('Clinic service unavailable');
    default:
      return new InternalServerErrorException('Clinic request failed');
  }
}
