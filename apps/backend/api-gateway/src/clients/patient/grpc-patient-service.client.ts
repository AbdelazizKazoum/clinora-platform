import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

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
  PatientServiceClient as GrpcPatientServiceContractClient,
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
import { PATIENT_SERVICE_NAME } from '@clinora/contracts-patient';

import {
  PATIENT_GRPC_CLIENT,
  type PatientServiceClient,
} from './patient-service.client';

@Injectable()
export class GrpcPatientServiceClient
  implements PatientServiceClient, OnModuleInit
{
  private service?: GrpcPatientServiceContractClient;

  constructor(
    @Inject(PATIENT_GRPC_CLIENT)
    private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.service =
      this.grpcClient.getService<GrpcPatientServiceContractClient>(
        PATIENT_SERVICE_NAME,
      );
  }

  getPatient(request: TenantRecordRequest): Promise<PatientReply> {
    return lastValueFrom(this.getService().getPatient(request));
  }

  listPatients(request: ListPatientsRequest): Promise<PatientsListReply> {
    return lastValueFrom(this.getService().listPatients(request));
  }

  createPatient(request: CreatePatientRequest): Promise<PatientReply> {
    return lastValueFrom(this.getService().createPatient(request));
  }

  updatePatient(request: UpdatePatientRequest): Promise<PatientReply> {
    return lastValueFrom(this.getService().updatePatient(request));
  }

  deletePatient(request: TenantRecordRequest): Promise<SuccessReply> {
    return lastValueFrom(this.getService().deletePatient(request));
  }

  softDeletePatient(request: TenantRecordRequest): Promise<SuccessReply> {
    return lastValueFrom(this.getService().softDeletePatient(request));
  }

  restorePatient(request: TenantRecordRequest): Promise<PatientReply> {
    return lastValueFrom(this.getService().restorePatient(request));
  }

  getPatientByUserId(
    request: GetPatientByUserIdRequest,
  ): Promise<PatientReply> {
    return lastValueFrom(this.getService().getPatientByUserId(request));
  }

  searchPatientsByName(
    request: SearchPatientsByNameRequest,
  ): Promise<PatientsReply> {
    return lastValueFrom(this.getService().searchPatientsByName(request));
  }

  getInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply> {
    return lastValueFrom(this.getService().getInsuranceProvider(request));
  }

  listInsuranceProviders(
    request: ListInsuranceProvidersRequest,
  ): Promise<InsuranceProvidersReply> {
    return lastValueFrom(this.getService().listInsuranceProviders(request));
  }

  createInsuranceProvider(
    request: CreateInsuranceProviderRequest,
  ): Promise<InsuranceProviderReply> {
    return lastValueFrom(this.getService().createInsuranceProvider(request));
  }

  updateInsuranceProvider(
    request: UpdateInsuranceProviderRequest,
  ): Promise<InsuranceProviderReply> {
    return lastValueFrom(this.getService().updateInsuranceProvider(request));
  }

  deleteInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<SuccessReply> {
    return lastValueFrom(this.getService().deleteInsuranceProvider(request));
  }

  activateInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply> {
    return lastValueFrom(this.getService().activateInsuranceProvider(request));
  }

  deactivateInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply> {
    return lastValueFrom(
      this.getService().deactivateInsuranceProvider(request),
    );
  }

  getInsuranceTemplate(
    request: TenantRecordRequest,
  ): Promise<InsuranceTemplateReply> {
    return lastValueFrom(this.getService().getInsuranceTemplate(request));
  }

  listInsuranceTemplates(
    request: ListInsuranceTemplatesRequest,
  ): Promise<InsuranceTemplatesReply> {
    return lastValueFrom(this.getService().listInsuranceTemplates(request));
  }

  createInsuranceTemplate(
    request: CreateInsuranceTemplateRequest,
  ): Promise<InsuranceTemplateReply> {
    return lastValueFrom(this.getService().createInsuranceTemplate(request));
  }

  updateInsuranceTemplate(
    request: UpdateInsuranceTemplateRequest,
  ): Promise<InsuranceTemplateReply> {
    return lastValueFrom(this.getService().updateInsuranceTemplate(request));
  }

  deleteInsuranceTemplate(request: TenantRecordRequest): Promise<SuccessReply> {
    return lastValueFrom(this.getService().deleteInsuranceTemplate(request));
  }

  getPatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply> {
    return lastValueFrom(this.getService().getPatientInsurance(request));
  }

  listPatientInsurances(
    request: ListPatientInsurancesRequest,
  ): Promise<PatientInsurancesReply> {
    return lastValueFrom(this.getService().listPatientInsurances(request));
  }

  listClinicPatientInsurances(
    request: ListClinicPatientInsurancesRequest,
  ): Promise<PatientInsurancesReply> {
    return lastValueFrom(
      this.getService().listClinicPatientInsurances(request),
    );
  }

  createPatientInsurance(
    request: CreatePatientInsuranceRequest,
  ): Promise<PatientInsuranceReply> {
    return lastValueFrom(this.getService().createPatientInsurance(request));
  }

  updatePatientInsurance(
    request: UpdatePatientInsuranceRequest,
  ): Promise<PatientInsuranceReply> {
    return lastValueFrom(this.getService().updatePatientInsurance(request));
  }

  deletePatientInsurance(request: TenantRecordRequest): Promise<SuccessReply> {
    return lastValueFrom(this.getService().deletePatientInsurance(request));
  }

  activatePatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply> {
    return lastValueFrom(this.getService().activatePatientInsurance(request));
  }

  deactivatePatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply> {
    return lastValueFrom(this.getService().deactivatePatientInsurance(request));
  }

  setAllPatientInsurancesActive(
    request: SetAllPatientInsurancesActiveRequest,
  ): Promise<SuccessReply> {
    return lastValueFrom(
      this.getService().setAllPatientInsurancesActive(request),
    );
  }

  getPatientDocument(
    request: TenantRecordRequest,
  ): Promise<PatientDocumentReply> {
    return lastValueFrom(this.getService().getPatientDocument(request));
  }

  listPatientDocuments(
    request: ListPatientDocumentsRequest,
  ): Promise<PatientDocumentsReply> {
    return lastValueFrom(this.getService().listPatientDocuments(request));
  }

  listClinicPatientDocuments(
    request: ListClinicPatientDocumentsRequest,
  ): Promise<PatientDocumentsReply> {
    return lastValueFrom(this.getService().listClinicPatientDocuments(request));
  }

  createPatientDocument(
    request: CreatePatientDocumentRequest,
  ): Promise<PatientDocumentReply> {
    return lastValueFrom(this.getService().createPatientDocument(request));
  }

  updatePatientDocument(
    request: UpdatePatientDocumentRequest,
  ): Promise<PatientDocumentReply> {
    return lastValueFrom(this.getService().updatePatientDocument(request));
  }

  deletePatientDocument(request: TenantRecordRequest): Promise<SuccessReply> {
    return lastValueFrom(this.getService().deletePatientDocument(request));
  }

  deleteManyPatientDocuments(
    request: DeleteManyPatientDocumentsRequest,
  ): Promise<SuccessReply> {
    return lastValueFrom(this.getService().deleteManyPatientDocuments(request));
  }

  private getService(): GrpcPatientServiceContractClient {
    if (!this.service) {
      throw new Error('Patient gRPC client has not been initialized');
    }
    return this.service;
  }
}
