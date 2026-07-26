import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { CLINIC_SERVICE_NAME } from '@clinora/contracts-clinic';

import { ManageClinicsUseCase } from '../../application/use-cases/manage-clinics.use-case';
import { ManageStaffMembersUseCase } from '../../application/use-cases/manage-staff-members.use-case';
import { ManageWorkingHoursUseCase } from '../../application/use-cases/manage-working-hours.use-case';
import { ClinicGrpcMapper } from './clinic.grpc-mapper';
import {
  ClinicIdInput,
  CreateClinicInput,
  CreateStaffMemberInput,
  DeleteStaffMemberInput,
  GetStaffMemberInput,
  ListStaffMembersInput,
  UpdateStaffMemberInput,
  UpsertWorkingHoursInput,
} from './clinic.grpc-inputs';
import { rethrowClinicRpcError } from './clinic-rpc-error';

@Controller()
export class ClinicGrpcController {
  constructor(
    private readonly clinics: ManageClinicsUseCase,
    private readonly workingHours: ManageWorkingHoursUseCase,
    private readonly staffMembers: ManageStaffMembersUseCase,
  ) {}

  @GrpcMethod(CLINIC_SERVICE_NAME, 'GetClinic')
  async getClinic(input: ClinicIdInput) {
    try {
      return ClinicGrpcMapper.clinic(
        await this.clinics.get(input.clinicId),
      );
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'CreateClinic')
  async createClinic(input: CreateClinicInput) {
    try {
      return ClinicGrpcMapper.clinic(await this.clinics.create(input));
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'GetWorkingHours')
  async getWorkingHours(input: ClinicIdInput) {
    try {
      const entries = await this.workingHours.get(input.clinicId);
      return { entries: entries.map(ClinicGrpcMapper.workingHours) };
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'UpsertWorkingHours')
  async upsertWorkingHours(input: UpsertWorkingHoursInput) {
    try {
      const entries = await this.workingHours.upsert(
        input.clinicId,
        input.entries,
      );
      return { entries: entries.map(ClinicGrpcMapper.workingHours) };
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'GetStaffMember')
  async getStaffMember(input: GetStaffMemberInput) {
    try {
      return ClinicGrpcMapper.staffMember(
        await this.staffMembers.getByUserId(
          input.clinicId,
          input.userId,
        ),
      );
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'ListStaffMembers')
  async listStaffMembers(input: ListStaffMembersInput) {
    try {
      const members = await this.staffMembers.list(input.clinicId);
      return { items: members.map(ClinicGrpcMapper.staffMember) };
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'CreateStaffMember')
  async createStaffMember(input: CreateStaffMemberInput) {
    try {
      return ClinicGrpcMapper.staffMember(
        await this.staffMembers.create(input),
      );
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'UpdateStaffMember')
  async updateStaffMember(input: UpdateStaffMemberInput) {
    try {
      const { clinicId, staffMemberId, ...updates } = input;
      return ClinicGrpcMapper.staffMember(
        await this.staffMembers.update(
          clinicId,
          staffMemberId,
          updates,
        ),
      );
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }

  @GrpcMethod(CLINIC_SERVICE_NAME, 'DeleteStaffMember')
  async deleteStaffMember(input: DeleteStaffMemberInput) {
    try {
      await this.staffMembers.delete(
        input.clinicId,
        input.staffMemberId,
      );
      return { success: true };
    } catch (error: unknown) {
      rethrowClinicRpcError(error);
    }
  }
}
