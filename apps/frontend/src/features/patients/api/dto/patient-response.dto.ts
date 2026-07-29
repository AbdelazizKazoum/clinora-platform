import type { PatientGender, PatientStatus } from '../../model/patient';

export interface PatientResponseDto {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  status: PatientStatus;
  userId: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: PatientGender | '';
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

export interface PatientListItemResponseDto {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: PatientStatus;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: PatientGender | '';
  createdAt: string;
  updatedAt: string;
}

export interface PageMetaResponseDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListPatientsResponseDto {
  items?: PatientListItemResponseDto[];
  meta: PageMetaResponseDto;
}

export interface SuccessResponseDto {
  success: true;
}
