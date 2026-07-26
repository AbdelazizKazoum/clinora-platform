import { Patient } from '../entities/patient';
import { PatientGender } from '../enums/patient-gender.enum';
import { PatientStatus } from '../enums/patient-status.enum';

export interface CreatePatient {
  clinicId: string;
  firstName: string;
  lastName: string;
  userId?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: PatientGender;
  address?: string;
  notes?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
  status?: PatientStatus;
}

export interface UpdatePatient {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | null;
  gender?: PatientGender | null;
  address?: string | null;
  notes?: string | null;
  allergies?: string | null;
  chronicConditions?: string | null;
  currentMedications?: string | null;
  medicalNotes?: string | null;
  status?: PatientStatus;
}

export interface ListPatients {
  clinicId: string;
  page?: number;
  limit?: number;
  status?: PatientStatus;
  gender?: PatientGender;
  search?: string;
  isNew?: boolean;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PatientListResult {
  items: Patient[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientRepository {
  create(input: CreatePatient): Promise<Patient>;
  findById(clinicId: string, id: string): Promise<Patient | null>;
  findByUserId(clinicId: string, userId: string): Promise<Patient | null>;
  list(query: ListPatients): Promise<PatientListResult>;
  searchByName(
    clinicId: string,
    firstName?: string,
    lastName?: string,
  ): Promise<Patient[]>;
  update(
    clinicId: string,
    id: string,
    input: UpdatePatient,
  ): Promise<Patient | null>;
  delete(clinicId: string, id: string): Promise<boolean>;
  softDelete(clinicId: string, id: string): Promise<boolean>;
  restore(clinicId: string, id: string): Promise<Patient | null>;
}
