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

export const PATIENT_SERVICE_CLIENT = Symbol('PATIENT_SERVICE_CLIENT');
export const PATIENT_GRPC_CLIENT = Symbol('PATIENT_GRPC_CLIENT');

export interface PatientServiceClient {
  getPatient(request: TenantRecordRequest): Promise<PatientReply>;
  listPatients(request: ListPatientsRequest): Promise<PatientsListReply>;
  createPatient(request: CreatePatientRequest): Promise<PatientReply>;
  updatePatient(request: UpdatePatientRequest): Promise<PatientReply>;
  deletePatient(request: TenantRecordRequest): Promise<SuccessReply>;
  softDeletePatient(request: TenantRecordRequest): Promise<SuccessReply>;
  restorePatient(request: TenantRecordRequest): Promise<PatientReply>;
  getPatientByUserId(
    request: GetPatientByUserIdRequest,
  ): Promise<PatientReply>;
  searchPatientsByName(
    request: SearchPatientsByNameRequest,
  ): Promise<PatientsReply>;
  getInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply>;
  listInsuranceProviders(
    request: ListInsuranceProvidersRequest,
  ): Promise<InsuranceProvidersReply>;
  createInsuranceProvider(
    request: CreateInsuranceProviderRequest,
  ): Promise<InsuranceProviderReply>;
  updateInsuranceProvider(
    request: UpdateInsuranceProviderRequest,
  ): Promise<InsuranceProviderReply>;
  deleteInsuranceProvider(request: TenantRecordRequest): Promise<SuccessReply>;
  activateInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply>;
  deactivateInsuranceProvider(
    request: TenantRecordRequest,
  ): Promise<InsuranceProviderReply>;
  getInsuranceTemplate(
    request: TenantRecordRequest,
  ): Promise<InsuranceTemplateReply>;
  listInsuranceTemplates(
    request: ListInsuranceTemplatesRequest,
  ): Promise<InsuranceTemplatesReply>;
  createInsuranceTemplate(
    request: CreateInsuranceTemplateRequest,
  ): Promise<InsuranceTemplateReply>;
  updateInsuranceTemplate(
    request: UpdateInsuranceTemplateRequest,
  ): Promise<InsuranceTemplateReply>;
  deleteInsuranceTemplate(request: TenantRecordRequest): Promise<SuccessReply>;
  getPatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply>;
  listPatientInsurances(
    request: ListPatientInsurancesRequest,
  ): Promise<PatientInsurancesReply>;
  listClinicPatientInsurances(
    request: ListClinicPatientInsurancesRequest,
  ): Promise<PatientInsurancesReply>;
  createPatientInsurance(
    request: CreatePatientInsuranceRequest,
  ): Promise<PatientInsuranceReply>;
  updatePatientInsurance(
    request: UpdatePatientInsuranceRequest,
  ): Promise<PatientInsuranceReply>;
  deletePatientInsurance(request: TenantRecordRequest): Promise<SuccessReply>;
  activatePatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply>;
  deactivatePatientInsurance(
    request: TenantRecordRequest,
  ): Promise<PatientInsuranceReply>;
  setAllPatientInsurancesActive(
    request: SetAllPatientInsurancesActiveRequest,
  ): Promise<SuccessReply>;
  getPatientDocument(
    request: TenantRecordRequest,
  ): Promise<PatientDocumentReply>;
  listPatientDocuments(
    request: ListPatientDocumentsRequest,
  ): Promise<PatientDocumentsReply>;
  listClinicPatientDocuments(
    request: ListClinicPatientDocumentsRequest,
  ): Promise<PatientDocumentsReply>;
  createPatientDocument(
    request: CreatePatientDocumentRequest,
  ): Promise<PatientDocumentReply>;
  updatePatientDocument(
    request: UpdatePatientDocumentRequest,
  ): Promise<PatientDocumentReply>;
  deletePatientDocument(request: TenantRecordRequest): Promise<SuccessReply>;
  deleteManyPatientDocuments(
    request: DeleteManyPatientDocumentsRequest,
  ): Promise<SuccessReply>;
}
