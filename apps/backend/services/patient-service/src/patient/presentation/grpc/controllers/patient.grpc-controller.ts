import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { PATIENT_SERVICE_NAME } from '@clinora/contracts-patient';

import { ManagePatientsUseCase } from '../../../application/use-cases/manage-patients.use-case';
import { PatientGrpcMapper } from '../patient.grpc-mapper';
import {
  CreatePatientInput,
  GetPatientByUserIdInput,
  ListPatientsInput,
  SearchPatientsByNameInput,
  TenantRecordInput,
  UpdatePatientInput,
} from '../patient.grpc-inputs';
import { rethrowPatientRpcError } from '../patient-rpc-error';

@Controller()
export class PatientGrpcController {
  constructor(private readonly patients: ManagePatientsUseCase) {}

  @GrpcMethod(PATIENT_SERVICE_NAME, 'GetPatient')
  async get(input: TenantRecordInput) {
    try {
      return PatientGrpcMapper.patient(
        await this.patients.get(input.clinicId, input.id),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListPatients')
  async list(input: ListPatientsInput) {
    try {
      const result = await this.patients.list({
        ...input,
        createdFrom: input.createdFrom
          ? new Date(input.createdFrom)
          : undefined,
        createdTo: input.createdTo ? new Date(input.createdTo) : undefined,
      });
      return {
        items: result.items.map(PatientGrpcMapper.patientListItem),
        meta: result.meta,
      };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'CreatePatient')
  async create(input: CreatePatientInput) {
    try {
      return PatientGrpcMapper.patient(
        await this.patients.create({
          ...input,
          dateOfBirth: input.dateOfBirth
            ? new Date(input.dateOfBirth)
            : undefined,
        }),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'UpdatePatient')
  async update(input: UpdatePatientInput) {
    try {
      return PatientGrpcMapper.patient(
        await this.patients.update(input.clinicId, input.patientId, {
          ...input,
          dateOfBirth:
            input.dateOfBirth === undefined
              ? undefined
              : input.dateOfBirth === null
                ? null
                : new Date(input.dateOfBirth),
        }),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeletePatient')
  async delete(input: TenantRecordInput) {
    try {
      await this.patients.delete(input.clinicId, input.id);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'SoftDeletePatient')
  async softDelete(input: TenantRecordInput) {
    try {
      await this.patients.softDelete(input.clinicId, input.id);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'RestorePatient')
  async restore(input: TenantRecordInput) {
    try {
      return PatientGrpcMapper.patient(
        await this.patients.restore(input.clinicId, input.id),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'GetPatientByUserId')
  async getByUserId(input: GetPatientByUserIdInput) {
    try {
      return PatientGrpcMapper.patient(
        await this.patients.getByUserId(input.clinicId, input.userId),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'SearchPatientsByName')
  async searchByName(input: SearchPatientsByNameInput) {
    try {
      const patients = await this.patients.searchByName(
        input.clinicId,
        input.firstName,
        input.lastName,
      );
      return { items: patients.map(PatientGrpcMapper.patient) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }
}
