import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { PATIENT_SERVICE_NAME } from '@clinora/contracts-patient';

import { ManageInsuranceProvidersUseCase } from '../../../application/use-cases/manage-insurance-providers.use-case';
import { PatientGrpcMapper } from '../patient.grpc-mapper';
import {
  CreateInsuranceProviderInput,
  ListInsuranceProvidersInput,
  TenantRecordInput,
  UpdateInsuranceProviderInput,
} from '../patient.grpc-inputs';
import { rethrowPatientRpcError } from '../patient-rpc-error';

@Controller()
export class InsuranceProviderGrpcController {
  constructor(
    private readonly providers: ManageInsuranceProvidersUseCase,
  ) {}

  @GrpcMethod(PATIENT_SERVICE_NAME, 'GetInsuranceProvider')
  async get(input: TenantRecordInput) {
    try {
      return PatientGrpcMapper.provider(
        await this.providers.get(input.clinicId, input.id),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListInsuranceProviders')
  async list(input: ListInsuranceProvidersInput) {
    try {
      const providers = await this.providers.list(
        input.clinicId,
        input.isActive,
        input.search,
      );
      return { providers: providers.map(PatientGrpcMapper.provider) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'CreateInsuranceProvider')
  async create(input: CreateInsuranceProviderInput) {
    try {
      return PatientGrpcMapper.provider(
        await this.providers.create(input),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'UpdateInsuranceProvider')
  async update(input: UpdateInsuranceProviderInput) {
    try {
      return PatientGrpcMapper.provider(
        await this.providers.update(input.clinicId, input.providerId, input),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeleteInsuranceProvider')
  async delete(input: TenantRecordInput) {
    try {
      await this.providers.delete(input.clinicId, input.id);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ActivateInsuranceProvider')
  activate(input: TenantRecordInput) {
    return this.setActive(input, true);
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeactivateInsuranceProvider')
  deactivate(input: TenantRecordInput) {
    return this.setActive(input, false);
  }

  private async setActive(input: TenantRecordInput, isActive: boolean) {
    try {
      return PatientGrpcMapper.provider(
        await this.providers.setActive(input.clinicId, input.id, isActive),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }
}
