import { PatientInsurance } from '../entities/patient-insurance';

export interface CreatePatientInsurance {
  clinicId: string;
  patientId: string;
  insuranceProviderId: string;
  policyNumber?: string;
  memberId?: string;
  isActive?: boolean;
}

export interface UpdatePatientInsurance {
  policyNumber?: string | null;
  memberId?: string | null;
  isActive?: boolean;
}

export interface PatientInsuranceRepository {
  create(input: CreatePatientInsurance): Promise<PatientInsurance>;
  findById(clinicId: string, id: string): Promise<PatientInsurance | null>;
  listByPatient(
    clinicId: string,
    patientId: string,
    isActive?: boolean,
  ): Promise<PatientInsurance[]>;
  listByClinic(
    clinicId: string,
    isActive?: boolean,
    providerId?: string,
  ): Promise<PatientInsurance[]>;
  update(
    clinicId: string,
    id: string,
    input: UpdatePatientInsurance,
  ): Promise<PatientInsurance | null>;
  delete(clinicId: string, id: string): Promise<boolean>;
  setActive(
    clinicId: string,
    id: string,
    isActive: boolean,
  ): Promise<PatientInsurance | null>;
  setAllActive(
    clinicId: string,
    patientId: string,
    isActive: boolean,
  ): Promise<void>;
}
