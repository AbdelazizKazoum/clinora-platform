import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { PATIENT_SERVICE_NAME } from '@clinora/contracts-patient';

import { ManagePatientInsurancesUseCase } from '../../../application/use-cases/manage-patient-insurances.use-case';
import { PatientGrpcMapper } from '../patient.grpc-mapper';
import {
  CreatePatientInsuranceInput,
  ListClinicPatientInsurancesInput,
  ListPatientInsurancesInput,
  SetAllPatientInsurancesActiveInput,
  TenantRecordInput,
  UpdatePatientInsuranceInput,
} from '../patient.grpc-inputs';
import { rethrowPatientRpcError } from '../patient-rpc-error';

@Controller()
export class PatientInsuranceGrpcController {
  constructor(
    private readonly insurances: ManagePatientInsurancesUseCase,
  ) {}

  @GrpcMethod(PATIENT_SERVICE_NAME, 'GetPatientInsurance')
  async get(input: TenantRecordInput) {
    try {
      return PatientGrpcMapper.insurance(
        await this.insurances.get(input.clinicId, input.id),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListPatientInsurances')
  async listByPatient(input: ListPatientInsurancesInput) {
    try {
      const insurances = await this.insurances.listByPatient(
        input.clinicId,
        input.patientId,
        input.isActive,
      );
      return { insurances: insurances.map(PatientGrpcMapper.insurance) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListClinicPatientInsurances')
  async listByClinic(input: ListClinicPatientInsurancesInput) {
    try {
      const insurances = await this.insurances.listByClinic(
        input.clinicId,
        input.isActive,
        input.insuranceProviderId,
      );
      return { insurances: insurances.map(PatientGrpcMapper.insurance) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'CreatePatientInsurance')
  async create(input: CreatePatientInsuranceInput) {
    try {
      return PatientGrpcMapper.insurance(
        await this.insurances.create(input),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'UpdatePatientInsurance')
  async update(input: UpdatePatientInsuranceInput) {
    try {
      return PatientGrpcMapper.insurance(
        await this.insurances.update(
          input.clinicId,
          input.insuranceId,
          input,
        ),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeletePatientInsurance')
  async delete(input: TenantRecordInput) {
    try {
      await this.insurances.delete(input.clinicId, input.id);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ActivatePatientInsurance')
  activate(input: TenantRecordInput) {
    return this.setActive(input, true);
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeactivatePatientInsurance')
  deactivate(input: TenantRecordInput) {
    return this.setActive(input, false);
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'SetAllPatientInsurancesActive')
  async setAllActive(input: SetAllPatientInsurancesActiveInput) {
    try {
      await this.insurances.setAllActive(
        input.clinicId,
        input.patientId,
        input.isActive,
      );
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  private async setActive(input: TenantRecordInput, isActive: boolean) {
    try {
      return PatientGrpcMapper.insurance(
        await this.insurances.setActive(input.clinicId, input.id, isActive),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }
}
