import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  AUTH_SERVICE_PORT,
  CLINIC_REPOSITORY,
  STAFF_MEMBER_REPOSITORY,
} from '../../clinic.tokens';
import { StaffMember } from '../../domain/entities/staff-member';
import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import type {
  CreateStaffMember,
  StaffMemberRepository,
  UpdateStaffMember,
} from '../../domain/repositories/staff-member-repository.interface';
import type { AuthServicePort } from '../ports/auth-service.port';
import {
  ClinicIdentityConsistencyError,
  ClinicRecordConflictError,
  ClinicRecordNotFoundError,
} from '../errors/clinic.errors';

export interface CreateStaffMemberWithCredentials
  extends Omit<CreateStaffMember, 'userId'> {
  password: string;
}

@Injectable()
export class ManageStaffMembersUseCase {
  private readonly logger = new Logger(ManageStaffMembersUseCase.name);

  constructor(
    @Inject(CLINIC_REPOSITORY)
    private readonly clinics: ClinicRepository,
    @Inject(STAFF_MEMBER_REPOSITORY)
    private readonly staffMembers: StaffMemberRepository,
    @Inject(AUTH_SERVICE_PORT)
    private readonly auth: AuthServicePort,
  ) {}

  async create(
    input: CreateStaffMemberWithCredentials,
  ): Promise<StaffMember> {
    await this.assertClinicExists(input.clinicId);
    if (await this.staffMembers.findByEmail(input.clinicId, input.email)) {
      throw new ClinicRecordConflictError(
        `A staff member with email "${input.email}" already exists`,
      );
    }

    const correlationId = randomUUID();
    const identity = await this.auth.provisionStaffIdentity({
      clinicId: input.clinicId,
      email: input.email,
      password: input.password,
      fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
      role: input.role,
    });

    try {
      return await this.staffMembers.create({
        clinicId: input.clinicId,
        userId: identity.id,
        role: input.role,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        specialization: input.specialization,
        avatar: input.avatar,
      });
    } catch (error: unknown) {
      try {
        await this.auth.deleteProvisionedIdentity({
          userId: identity.id,
          clinicId: input.clinicId,
        });
      } catch (compensationError: unknown) {
        this.logger.error(
          JSON.stringify({
            operation: 'deleteProvisionedIdentity',
            correlationId,
            identityId: identity.id,
            clinicId: input.clinicId,
          }),
          compensationError instanceof Error
            ? compensationError.stack
            : undefined,
        );
        throw new ClinicIdentityConsistencyError(
          identity.id,
          input.clinicId,
          correlationId,
        );
      }

      throw error;
    }
  }

  async getByUserId(
    clinicId: string,
    userId: string,
  ): Promise<StaffMember> {
    const member = await this.staffMembers.findByUserId(clinicId, userId);
    if (!member) {
      throw new ClinicRecordNotFoundError('Staff member for user', userId);
    }
    return member;
  }

  async list(clinicId: string): Promise<StaffMember[]> {
    await this.assertClinicExists(clinicId);
    return this.staffMembers.list(clinicId);
  }

  async update(
    clinicId: string,
    id: string,
    input: UpdateStaffMember,
  ): Promise<StaffMember> {
    const member = await this.staffMembers.update(clinicId, id, input);
    if (!member) {
      throw new ClinicRecordNotFoundError('Staff member', id);
    }
    return member;
  }

  async delete(clinicId: string, id: string): Promise<void> {
    if (!(await this.staffMembers.delete(clinicId, id))) {
      throw new ClinicRecordNotFoundError('Staff member', id);
    }
  }

  private async assertClinicExists(clinicId: string): Promise<void> {
    if (!(await this.clinics.findById(clinicId))) {
      throw new ClinicRecordNotFoundError('Clinic', clinicId);
    }
  }
}
