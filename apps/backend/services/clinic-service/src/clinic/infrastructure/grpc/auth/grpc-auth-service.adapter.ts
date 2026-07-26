import { status } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import type {
  AuthServiceClient,
  AuthUserRole,
} from '@clinora/contracts-auth';
import { AUTH_SERVICE_NAME } from '@clinora/contracts-auth';

import {
  ClinicDependencyError,
  ClinicRecordConflictError,
  ClinicValidationError,
} from '../../../application/errors/clinic.errors';
import type {
  AuthServicePort,
  RegisteredStaffUser,
  RegisterStaffUser,
} from '../../../application/ports/auth-service.port';
import { AUTH_GRPC_CLIENT } from '../../../clinic.tokens';
import { StaffRole } from '../../../domain/enums/staff-role.enum';

interface GrpcServiceError {
  code?: number;
  details?: string;
  message?: string;
}

const AUTH_ROLES: Record<StaffRole, AuthUserRole> = {
  [StaffRole.Secretary]: 'secretary',
  [StaffRole.DentalAssistant]: 'dental_assistant',
  [StaffRole.Doctor]: 'doctor',
  [StaffRole.Admin]: 'admin',
};

@Injectable()
export class GrpcAuthServiceAdapter
  implements AuthServicePort, OnModuleInit
{
  private service?: AuthServiceClient;

  constructor(
    @Inject(AUTH_GRPC_CLIENT)
    private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.service =
      this.grpcClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async registerStaff(
    input: RegisterStaffUser,
  ): Promise<RegisteredStaffUser> {
    try {
      const reply = await lastValueFrom(
        this.getService().register({
          clinicId: input.clinicId,
          email: input.email,
          password: input.password,
          fullName: input.fullName,
          role: AUTH_ROLES[input.role],
        }),
      );
      return { id: reply.user.id };
    } catch (error: unknown) {
      this.rethrowDependencyError(error);
    }
  }

  private getService(): AuthServiceClient {
    if (!this.service) {
      throw new ClinicDependencyError(
        'Auth service client has not been initialized',
      );
    }
    return this.service;
  }

  private rethrowDependencyError(error: unknown): never {
    const grpcError = error as GrpcServiceError;
    const message =
      grpcError.details ?? grpcError.message ?? 'Auth service request failed';

    if (grpcError.code === status.ALREADY_EXISTS) {
      throw new ClinicRecordConflictError(message);
    }
    if (grpcError.code === status.INVALID_ARGUMENT) {
      throw new ClinicValidationError(message);
    }
    throw new ClinicDependencyError(message);
  }
}
