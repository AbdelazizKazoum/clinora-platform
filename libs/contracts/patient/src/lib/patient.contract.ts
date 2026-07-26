import { resolve } from 'node:path';

import type { Observable } from 'rxjs';

export const PATIENT_PACKAGE_NAME = 'patient';
export const PATIENT_SERVICE_NAME = 'PatientService';

export const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const PATIENT_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export const PATIENT_DOCUMENT_TYPES = [
  'GENERAL',
  'INSURANCE',
  'MEDICAL',
  'OTHER',
] as const;

export type PatientStatus = (typeof PATIENT_STATUSES)[number];
export type PatientGender = (typeof PATIENT_GENDERS)[number];
export type PatientDocumentType = (typeof PATIENT_DOCUMENT_TYPES)[number];

export function resolvePatientProtoPath(): string {
  return resolve(
    process.env['PATIENT_PROTO_PATH'] ??
      'libs/contracts/patient/src/lib/patient.proto',
  );
}

export interface TenantRecordRequest {
  clinicId: string;
  id: string;
}

export interface PatientReply {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  status: string;
  userId: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  notes: string;
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  medicalNotes: string;
  deletedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListItem {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PatientsListReply {
  items: PatientListItem[];
  meta: PageMeta;
}

export interface CreatePatientRequest {
  clinicId: string;
  firstName: string;
  lastName: string;
  userId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: PatientGender;
  address?: string;
  notes?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
  status?: PatientStatus;
}

export interface UpdatePatientRequest
  extends Partial<Omit<CreatePatientRequest, 'clinicId'>> {
  clinicId: string;
  patientId: string;
}

export interface ListPatientsRequest {
  clinicId: string;
  page?: number;
  limit?: number;
  status?: PatientStatus;
  gender?: PatientGender;
  search?: string;
  isNew?: boolean;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SuccessReply {
  success: boolean;
}

export interface PatientsReply {
  items: PatientReply[];
}

export interface GetPatientByUserIdRequest {
  clinicId: string;
  userId: string;
}

export interface SearchPatientsByNameRequest {
  clinicId: string;
  firstName?: string;
  lastName?: string;
}

export interface InsuranceProviderReply {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceProvidersReply {
  providers: InsuranceProviderReply[];
}

export interface ListInsuranceProvidersRequest {
  clinicId: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateInsuranceProviderRequest {
  clinicId: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateInsuranceProviderRequest
  extends Partial<Omit<CreateInsuranceProviderRequest, 'clinicId'>> {
  clinicId: string;
  providerId: string;
}

export interface InsuranceTemplateReply {
  id: string;
  clinicId: string;
  insuranceProviderId: string;
  name: string;
  fileUrl: string;
  createdAt: string;
}

export interface InsuranceTemplatesReply {
  templates: InsuranceTemplateReply[];
}

export interface ListInsuranceTemplatesRequest {
  clinicId: string;
  providerId?: string;
  providerIds: string[];
  search?: string;
}

export interface CreateInsuranceTemplateRequest {
  clinicId: string;
  insuranceProviderId: string;
  name: string;
  fileUrl: string;
}

export interface UpdateInsuranceTemplateRequest {
  clinicId: string;
  templateId: string;
  name?: string;
  fileUrl?: string;
}

export interface PatientInsuranceReply {
  id: string;
  clinicId: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber: string;
  memberId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientInsurancesReply {
  insurances: PatientInsuranceReply[];
}

export interface ListPatientInsurancesRequest {
  clinicId: string;
  patientId: string;
  isActive?: boolean;
}

export interface ListClinicPatientInsurancesRequest {
  clinicId: string;
  isActive?: boolean;
  insuranceProviderId?: string;
}

export interface CreatePatientInsuranceRequest {
  clinicId: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber?: string;
  memberId?: string;
  isActive?: boolean;
}

export interface UpdatePatientInsuranceRequest {
  clinicId: string;
  insuranceId: string;
  policyNumber?: string;
  memberId?: string;
  isActive?: boolean;
}

export interface SetAllPatientInsurancesActiveRequest {
  clinicId: string;
  patientId: string;
  isActive: boolean;
}

export interface PatientDocumentReply {
  id: string;
  clinicId: string;
  patientId: string;
  type: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export interface PatientDocumentsReply {
  documents: PatientDocumentReply[];
}

export interface ListPatientDocumentsRequest {
  clinicId: string;
  patientId: string;
  type?: PatientDocumentType;
}

export interface ListClinicPatientDocumentsRequest {
  clinicId: string;
  type?: PatientDocumentType;
  patientId?: string;
  search?: string;
}

export interface CreatePatientDocumentRequest {
  clinicId: string;
  patientId: string;
  type: PatientDocumentType;
  title?: string;
  fileUrl: string;
}

export interface UpdatePatientDocumentRequest {
  clinicId: string;
  documentId: string;
  type?: PatientDocumentType;
  title?: string;
  fileUrl?: string;
}

export interface DeleteManyPatientDocumentsRequest {
  clinicId: string;
  ids: string[];
}

export interface PatientServiceClient {
  getPatient(request: TenantRecordRequest): Observable<PatientReply>;
  listPatients(
    request: ListPatientsRequest,
  ): Observable<PatientsListReply>;
  createPatient(
    request: CreatePatientRequest,
  ): Observable<PatientReply>;
  updatePatient(
    request: UpdatePatientRequest,
  ): Observable<PatientReply>;
  deletePatient(request: TenantRecordRequest): Observable<SuccessReply>;
  softDeletePatient(
    request: TenantRecordRequest,
  ): Observable<SuccessReply>;
  restorePatient(request: TenantRecordRequest): Observable<PatientReply>;
  getPatientByUserId(
    request: GetPatientByUserIdRequest,
  ): Observable<PatientReply>;
  searchPatientsByName(
    request: SearchPatientsByNameRequest,
  ): Observable<PatientsReply>;
  getInsuranceProvider(
    request: TenantRecordRequest,
  ): Observable<InsuranceProviderReply>;
  listInsuranceProviders(
    request: ListInsuranceProvidersRequest,
  ): Observable<InsuranceProvidersReply>;
  createInsuranceProvider(
    request: CreateInsuranceProviderRequest,
  ): Observable<InsuranceProviderReply>;
  updateInsuranceProvider(
    request: UpdateInsuranceProviderRequest,
  ): Observable<InsuranceProviderReply>;
  deleteInsuranceProvider(
    request: TenantRecordRequest,
  ): Observable<SuccessReply>;
  activateInsuranceProvider(
    request: TenantRecordRequest,
  ): Observable<InsuranceProviderReply>;
  deactivateInsuranceProvider(
    request: TenantRecordRequest,
  ): Observable<InsuranceProviderReply>;
  getInsuranceTemplate(
    request: TenantRecordRequest,
  ): Observable<InsuranceTemplateReply>;
  listInsuranceTemplates(
    request: ListInsuranceTemplatesRequest,
  ): Observable<InsuranceTemplatesReply>;
  createInsuranceTemplate(
    request: CreateInsuranceTemplateRequest,
  ): Observable<InsuranceTemplateReply>;
  updateInsuranceTemplate(
    request: UpdateInsuranceTemplateRequest,
  ): Observable<InsuranceTemplateReply>;
  deleteInsuranceTemplate(
    request: TenantRecordRequest,
  ): Observable<SuccessReply>;
  getPatientInsurance(
    request: TenantRecordRequest,
  ): Observable<PatientInsuranceReply>;
  listPatientInsurances(
    request: ListPatientInsurancesRequest,
  ): Observable<PatientInsurancesReply>;
  listClinicPatientInsurances(
    request: ListClinicPatientInsurancesRequest,
  ): Observable<PatientInsurancesReply>;
  createPatientInsurance(
    request: CreatePatientInsuranceRequest,
  ): Observable<PatientInsuranceReply>;
  updatePatientInsurance(
    request: UpdatePatientInsuranceRequest,
  ): Observable<PatientInsuranceReply>;
  deletePatientInsurance(
    request: TenantRecordRequest,
  ): Observable<SuccessReply>;
  activatePatientInsurance(
    request: TenantRecordRequest,
  ): Observable<PatientInsuranceReply>;
  deactivatePatientInsurance(
    request: TenantRecordRequest,
  ): Observable<PatientInsuranceReply>;
  setAllPatientInsurancesActive(
    request: SetAllPatientInsurancesActiveRequest,
  ): Observable<SuccessReply>;
  getPatientDocument(
    request: TenantRecordRequest,
  ): Observable<PatientDocumentReply>;
  listPatientDocuments(
    request: ListPatientDocumentsRequest,
  ): Observable<PatientDocumentsReply>;
  listClinicPatientDocuments(
    request: ListClinicPatientDocumentsRequest,
  ): Observable<PatientDocumentsReply>;
  createPatientDocument(
    request: CreatePatientDocumentRequest,
  ): Observable<PatientDocumentReply>;
  updatePatientDocument(
    request: UpdatePatientDocumentRequest,
  ): Observable<PatientDocumentReply>;
  deletePatientDocument(
    request: TenantRecordRequest,
  ): Observable<SuccessReply>;
  deleteManyPatientDocuments(
    request: DeleteManyPatientDocumentsRequest,
  ): Observable<SuccessReply>;
}
