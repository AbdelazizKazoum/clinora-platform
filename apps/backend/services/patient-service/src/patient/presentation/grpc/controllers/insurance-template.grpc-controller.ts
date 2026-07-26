import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { PATIENT_SERVICE_NAME } from '@clinora/contracts-patient';

import { ManageInsuranceTemplatesUseCase } from '../../../application/use-cases/manage-insurance-templates.use-case';
import { PatientGrpcMapper } from '../patient.grpc-mapper';
import {
  CreateInsuranceTemplateInput,
  ListInsuranceTemplatesInput,
  TenantRecordInput,
  UpdateInsuranceTemplateInput,
} from '../patient.grpc-inputs';
import { rethrowPatientRpcError } from '../patient-rpc-error';

@Controller()
export class InsuranceTemplateGrpcController {
  constructor(
    private readonly templates: ManageInsuranceTemplatesUseCase,
  ) {}

  @GrpcMethod(PATIENT_SERVICE_NAME, 'GetInsuranceTemplate')
  async get(input: TenantRecordInput) {
    try {
      return PatientGrpcMapper.template(
        await this.templates.get(input.clinicId, input.id),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'ListInsuranceTemplates')
  async list(input: ListInsuranceTemplatesInput) {
    try {
      const templates = await this.templates.list(
        input.clinicId,
        input.providerId,
        input.providerIds,
        input.search,
      );
      return { templates: templates.map(PatientGrpcMapper.template) };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'CreateInsuranceTemplate')
  async create(input: CreateInsuranceTemplateInput) {
    try {
      return PatientGrpcMapper.template(
        await this.templates.create(input),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'UpdateInsuranceTemplate')
  async update(input: UpdateInsuranceTemplateInput) {
    try {
      return PatientGrpcMapper.template(
        await this.templates.update(input.clinicId, input.templateId, input),
      );
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }

  @GrpcMethod(PATIENT_SERVICE_NAME, 'DeleteInsuranceTemplate')
  async delete(input: TenantRecordInput) {
    try {
      await this.templates.delete(input.clinicId, input.id);
      return { success: true };
    } catch (error: unknown) {
      rethrowPatientRpcError(error);
    }
  }
}
