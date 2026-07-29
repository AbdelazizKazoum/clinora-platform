import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  AUTH_SERVICE_PORT,
  CLINIC_REPOSITORY,
  STAFF_MEMBER_REPOSITORY,
} from '../../clinic.tokens';
import {
  deriveStaffMemberIsActive,
  isEnabledStaffAdmin,
  StaffMember,
} from '../../domain/entities/staff-member';
import { StaffStatus } from '../../domain/enums/staff-status.enum';
import type { ClinicRepository } from '../../domain/repositories/clinic-repository.interface';
import type {
  CreateStaffMember,
  StaffMemberRepository,
  UpdateStaffMember,
} from '../../domain/repositories/staff-member-repository.interface';
import type { AuthServicePort } from '../ports/auth-service.port';
import {
  ClinicIdentityConsistencyError,
  ClinicLastEnabledAdminError,
  ClinicRecordConflictError,
  ClinicRecordNotFoundError,
  ClinicSelfDeactivationError,
} from '../errors/clinic.errors';

export interface CreateStaffMemberWithCredentials
  extends Omit<CreateStaffMember, 'userId'> {
  password: string;
}

export interface UpdateStaffMemberCommand extends UpdateStaffMember {
  actorUserId: string;
}

interface ProposedStaffIdentity {
  email: string;
  fullName: string;
  role: StaffMember['properties']['role'];
  isActive: boolean;
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
    input: UpdateStaffMemberCommand,
  ): Promise<StaffMember> {
    const { actorUserId, ...updates } = input;
    const existingMember = await this.staffMembers.findById(clinicId, id);
    if (!existingMember) {
      throw new ClinicRecordNotFoundError('Staff member', id);
    }

    this.assertNotSelfDeactivation(existingMember, actorUserId, updates);

    const previousIdentity = this.toStaffIdentity(existingMember);
    const proposedIdentity = this.buildProposedIdentity(
      existingMember,
      updates,
    );
    const identityChanged = this.hasIdentityChanged(
      previousIdentity,
      proposedIdentity,
    );
    const requiresEnabledAdminGuard =
      this.removesEnabledAdmin(existingMember, updates);

    if (!identityChanged) {
      return this.persistStaffUpdate(
        clinicId,
        id,
        updates,
        requiresEnabledAdminGuard,
      );
    }

    const correlationId = randomUUID();
    await this.auth.updateStaffIdentity({
      userId: existingMember.properties.userId,
      clinicId,
      ...proposedIdentity,
    });

    let member: StaffMember | null;
    try {
      member = await this.persistStaffUpdate(
        clinicId,
        id,
        updates,
        requiresEnabledAdminGuard,
      );
    } catch (error: unknown) {
      try {
        await this.auth.updateStaffIdentity({
          userId: existingMember.properties.userId,
          clinicId,
          ...previousIdentity,
        });
      } catch (rollbackError: unknown) {
        const operation = 'updateStaffIdentityRollback';
        this.logger.error(
          JSON.stringify({
            operation,
            correlationId,
            identityId: existingMember.properties.userId,
            clinicId,
          }),
          rollbackError instanceof Error ? rollbackError.stack : undefined,
        );
        throw new ClinicIdentityConsistencyError(
          existingMember.properties.userId,
          clinicId,
          correlationId,
          operation,
        );
      }

      throw error;
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

  private toStaffIdentity(member: StaffMember): ProposedStaffIdentity {
    return {
      email: member.properties.email.trim().toLowerCase(),
      fullName: member.fullName.trim(),
      role: member.properties.role,
      isActive: deriveStaffMemberIsActive(member.properties.status),
    };
  }

  private buildProposedIdentity(
    member: StaffMember,
    input: UpdateStaffMember,
  ): ProposedStaffIdentity {
    const firstName = input.firstName ?? member.properties.firstName;
    const lastName = input.lastName ?? member.properties.lastName;
    const status = input.status ?? member.properties.status;

    return {
      email: (input.email ?? member.properties.email).trim().toLowerCase(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      role: input.role ?? member.properties.role,
      isActive: deriveStaffMemberIsActive(status),
    };
  }

  private assertNotSelfDeactivation(
    member: StaffMember,
    actorUserId: string,
    input: UpdateStaffMember,
  ): void {
    if (
      member.properties.userId === actorUserId &&
      input.status === StaffStatus.Inactive
    ) {
      throw new ClinicSelfDeactivationError();
    }
  }

  private removesEnabledAdmin(
    member: StaffMember,
    input: UpdateStaffMember,
  ): boolean {
    const proposedRole = input.role ?? member.properties.role;
    const proposedStatus = input.status ?? member.properties.status;

    return (
      isEnabledStaffAdmin(
        member.properties.role,
        member.properties.status,
      ) && !isEnabledStaffAdmin(proposedRole, proposedStatus)
    );
  }

  private async persistStaffUpdate(
    clinicId: string,
    id: string,
    input: UpdateStaffMember,
    requiresEnabledAdminGuard: boolean,
  ): Promise<StaffMember> {
    if (!requiresEnabledAdminGuard) {
      const member = await this.staffMembers.update(clinicId, id, input);
      if (!member) {
        throw new ClinicRecordNotFoundError('Staff member', id);
      }
      return member;
    }

    const result =
      await this.staffMembers.updatePreservingEnabledAdmin(
        clinicId,
        id,
        input,
      );

    if (result.outcome === 'not-found') {
      throw new ClinicRecordNotFoundError('Staff member', id);
    }
    if (result.outcome === 'last-enabled-admin') {
      throw new ClinicLastEnabledAdminError();
    }

    return result.member;
  }

  private hasIdentityChanged(
    previousIdentity: ProposedStaffIdentity,
    proposedIdentity: ProposedStaffIdentity,
  ): boolean {
    return (
      previousIdentity.email !== proposedIdentity.email ||
      previousIdentity.fullName !== proposedIdentity.fullName ||
      previousIdentity.role !== proposedIdentity.role ||
      previousIdentity.isActive !== proposedIdentity.isActive
    );
  }
}
