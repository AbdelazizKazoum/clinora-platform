import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { PATIENT_SERVICE_NAME } from '@clinora/contracts-patient';

import { ManagePatientDocumentsUseCase } from '../../../application/use-cases/manage-patient-documents.use-case';
import { PatientGrpcMapper } from '../patient.grpc-mapper';
import {
  CreatePatientDocumentInput,
  DeleteManyPatientDocumentsInput,
  ListClinicPatientDocumentsInput,
  ListPatientDocumentsInput,
  TenantRecordInput,
  UpdatePatientDocumentInput,
} from '../patient.grpc-inputs';
import { rethrowPatientRpcError } from '../patient-rpc-error';

@Controller()
export class PatientDocumentGrpcController {
  constructor(
    private readonly documents: ManagePatientDocumentsUseCase,
  ) {}

  @GrpcMethod(PATIENT_SERVICE_NAME, 'GetPatientDocument')
  async get(input: TenantRecordInput) {
    try {
      return PatientGrpcMapper.document(
        await this.documents.get(input.clinicId, input.id),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListPatientDocuments')
  async listByPatient(input: ListPatientDocumentsInput) {
    try {
      const documents = await this.documents.listByPatient(
        input.clinicId,
        input.patientId,
        input.type,
      );
      return { documents: documents.map(PatientGrpcMapper.document) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListClinicPatientDocuments')
  async listByClinic(input: ListClinicPatientDocumentsInput) {
    try {
      const documents = await this.documents.listByClinic(
        input.clinicId,
        input.type,
        input.patientId,
        input.search,
      );
      return { documents: documents.map(PatientGrpcMapper.document) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'CreatePatientDocument')
  async create(input: CreatePatientDocumentInput) {
    try {
      return PatientGrpcMapper.document(
        await this.documents.create(input),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'UpdatePatientDocument')
  async update(input: UpdatePatientDocumentInput) {
    try {
      return PatientGrpcMapper.document(
        await this.documents.update(
          input.clinicId,
          input.documentId,
          input,
        ),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeletePatientDocument')
  async delete(input: TenantRecordInput) {
    try {
      await this.documents.delete(input.clinicId, input.id);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeleteManyPatientDocuments')
  async deleteMany(input: DeleteManyPatientDocumentsInput) {
    try {
      await this.documents.deleteMany(input.clinicId, input.ids);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }
}
