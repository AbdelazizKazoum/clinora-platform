import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type {
  CreateInsuranceProviderRequest,
  CreateInsuranceTemplateRequest,
  CreatePatientDocumentRequest,
  CreatePatientInsuranceRequest,
  CreatePatientRequest,
  DeleteManyPatientDocumentsRequest,
  GetPatientByUserIdRequest,
  InsuranceProviderReply,
  InsuranceProvidersReply,
  InsuranceTemplateReply,
  InsuranceTemplatesReply,
  ListClinicPatientDocumentsRequest,
  ListClinicPatientInsurancesRequest,
  ListInsuranceProvidersRequest,
  ListInsuranceTemplatesRequest,
  ListPatientDocumentsRequest,
  ListPatientInsurancesRequest,
  ListPatientsRequest,
  PatientDocumentReply,
  PatientDocumentsReply,
  PatientInsuranceReply,
  PatientInsurancesReply,
  PatientReply,
  PatientsListReply,
  PatientsReply,
  SearchPatientsByNameRequest,
  SetAllPatientInsurancesActiveRequest,
  SuccessReply,
  TenantRecordRequest,
  UpdateInsuranceProviderRequest,
  UpdateInsuranceTemplateRequest,
  UpdatePatientDocumentRequest,
  UpdatePatientInsuranceRequest,
  UpdatePatientRequest,
} from '@clinora/contracts-patient';

import {
  PATIENT_SERVICE_CLIENT,
  type PatientServiceClient,
} from '../../clients/patient/patient-service.client';

@Injectable()
export class PatientsFacade {
  constructor(
    @Inject(PATIENT_SERVICE_CLIENT)
    private readonly patientsClient: PatientServiceClient,
  ) {}

  getPatient(request: TenantRecordRequest): Promise<PatientReply> {
    return this.execute(() => this.patientsClient.getPatient(request));
  }

  listPatients(request: ListPatientsRequest): Promise<PatientsListReply> {
    return this.execute(() => this.patientsClient.listPatients(request));
  }

  createPatient(request: CreatePatientRequest): Promise<PatientReply> {
    return this.execute(() => this.patientsClient.createPatient(request));
  }

  updatePatient(request: UpdatePatientRequest): Promise<PatientReply> {
    return this.execute(() => this.patientsClient.updatePatient(request));
  }

  deletePatient(request: TenantRecordRequest): Promise<SuccessReply> {
    return this.execute(() => this.patientsClient.deletePatient(request));
  }

  softDeletePatient(request: TenantRecordRequest): Promise<SuccessReply> {
    return this.execute(() => this.patientsClient.softDeletePatient(request));
  }

  restorePatient(request: TenantRecordRequest): Promise<PatientReply> {
    return this.execute(() => this.patientsClient.restorePatient(request));
  }

  getPatientByUserId(
    request: GetPatientByUserIdRequest,
  ): Promise<PatientReply> {
    return this.execute(() => this.patientsClient.getPatientByUserId(request));
  }

  searchPatientsByName(
    request: SearchPatientsByNameRequest,
  ): Promise<PatientsReply> {
    return this.execute(() => this.patientsClient.searchPatientsByName(request));
  }

  getInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply> {
    return this.execute(() => this.patientsClient.getInsuranceProvider(request));
  }

  listInsuranceProviders(
    request: ListInsuranceProvidersRequest,
  ): Promise<InsuranceProvidersReply> {
    return this.execute(() =>
      this.patientsClient.listInsuranceProviders(request),
    );
  }

  createInsuranceProvider(
    request: CreateInsuranceProviderRequest,
  ): Promise<InsuranceProviderReply> {
    return this.execute(() =>
      this.patientsClient.createInsuranceProvider(request),
    );
  }

  updateInsuranceProvider(
    request: UpdateInsuranceProviderRequest,
  ): Promise<InsuranceProviderReply> {
    return this.execute(() =>
      this.patientsClient.updateInsuranceProvider(request),
    );
  }

  deleteInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<SuccessReply> {
    return this.execute(() =>
      this.patientsClient.deleteInsuranceProvider(request),
    );
  }

  activateInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply> {
    return this.execute(() =>
      this.patientsClient.activateInsuranceProvider(request),
    );
  }

  deactivateInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply> {
    return this.execute(() =>
      this.patientsClient.deactivateInsuranceProvider(request),
    );
  }

  getInsuranceTemplate(
    request: TenantRecordRequest,
  ): Promise<InsuranceTemplateReply> {
    return this.execute(() => this.patientsClient.getInsuranceTemplate(request));
  }

  listInsuranceTemplates(
    request: ListInsuranceTemplatesRequest,
  ): Promise<InsuranceTemplatesReply> {
    return this.execute(() =>
      this.patientsClient.listInsuranceTemplates(request),
    );
  }

  createInsuranceTemplate(
    request: CreateInsuranceTemplateRequest,
  ): Promise<InsuranceTemplateReply> {
    return this.execute(() =>
      this.patientsClient.createInsuranceTemplate(request),
    );
  }

  updateInsuranceTemplate(
    request: UpdateInsuranceTemplateRequest,
  ): Promise<InsuranceTemplateReply> {
    return this.execute(() =>
      this.patientsClient.updateInsuranceTemplate(request),
    );
  }

  deleteInsuranceTemplate(request: TenantRecordRequest): Promise<SuccessReply> {
    return this.execute(() =>
      this.patientsClient.deleteInsuranceTemplate(request),
    );
  }

  getPatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply> {
    return this.execute(() => this.patientsClient.getPatientInsurance(request));
  }

  listPatientInsurances(
    request: ListPatientInsurancesRequest,
  ): Promise<PatientInsurancesReply> {
    return this.execute(() =>
      this.patientsClient.listPatientInsurances(request),
    );
  }

  listClinicPatientInsurances(
    request: ListClinicPatientInsurancesRequest,
  ): Promise<PatientInsurancesReply> {
    return this.execute(() =>
      this.patientsClient.listClinicPatientInsurances(request),
    );
  }

  createPatientInsurance(
    request: CreatePatientInsuranceRequest,
  ): Promise<PatientInsuranceReply> {
    return this.execute(() =>
      this.patientsClient.createPatientInsurance(request),
    );
  }

  updatePatientInsurance(
    request: UpdatePatientInsuranceRequest,
  ): Promise<PatientInsuranceReply> {
    return this.execute(() =>
      this.patientsClient.updatePatientInsurance(request),
    );
  }

  deletePatientInsurance(request: TenantRecordRequest): Promise<SuccessReply> {
    return this.execute(() =>
      this.patientsClient.deletePatientInsurance(request),
    );
  }

  activatePatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply> {
    return this.execute(() =>
      this.patientsClient.activatePatientInsurance(request),
    );
  }

  deactivatePatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply> {
    return this.execute(() =>
      this.patientsClient.deactivatePatientInsurance(request),
    );
  }

  setAllPatientInsurancesActive(
    request: SetAllPatientInsurancesActiveRequest,
  ): Promise<SuccessReply> {
    return this.execute(() =>
      this.patientsClient.setAllPatientInsurancesActive(request),
    );
  }

  getPatientDocument(
    request: TenantRecordRequest,
  ): Promise<PatientDocumentReply> {
    return this.execute(() => this.patientsClient.getPatientDocument(request));
  }

  listPatientDocuments(
    request: ListPatientDocumentsRequest,
  ): Promise<PatientDocumentsReply> {
    return this.execute(() =>
      this.patientsClient.listPatientDocuments(request),
    );
  }

  listClinicPatientDocuments(
    request: ListClinicPatientDocumentsRequest,
  ): Promise<PatientDocumentsReply> {
    return this.execute(() =>
      this.patientsClient.listClinicPatientDocuments(request),
    );
  }

  createPatientDocument(
    request: CreatePatientDocumentRequest,
  ): Promise<PatientDocumentReply> {
    return this.execute(() =>
      this.patientsClient.createPatientDocument(request),
    );
  }

  updatePatientDocument(
    request: UpdatePatientDocumentRequest,
  ): Promise<PatientDocumentReply> {
    return this.execute(() =>
      this.patientsClient.updatePatientDocument(request),
    );
  }

  deletePatientDocument(request: TenantRecordRequest): Promise<SuccessReply> {
    return this.execute(() =>
      this.patientsClient.deletePatientDocument(request),
    );
  }

  deleteManyPatientDocuments(
    request: DeleteManyPatientDocumentsRequest,
  ): Promise<SuccessReply> {
    return this.execute(() =>
      this.patientsClient.deleteManyPatientDocuments(request),
    );
  }

  private async execute<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (error: unknown) {
      throw mapPatientGrpcException(error);
    }
  }
}

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

function mapPatientGrpcException(error: unknown): HttpException {
  const grpcError = error as GrpcError;
  const message =
    grpcError.details ?? grpcError.message ?? 'Patient request failed';

  switch (grpcError.code) {
    case status.INVALID_ARGUMENT:
      return new BadRequestException(message);
    case status.ALREADY_EXISTS:
      return new ConflictException(message);
    case status.NOT_FOUND:
      return new NotFoundException(message);
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return new ServiceUnavailableException('Patient service unavailable');
    default:
      return new InternalServerErrorException('Patient request failed');
  }
}
