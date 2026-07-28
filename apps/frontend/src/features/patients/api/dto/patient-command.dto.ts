import type { PatientGender, PatientStatus } from '../../model/patient';

export interface CreatePatientRequestDto {
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

export interface UpdatePatientRequestDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: PatientGender | '';
  address?: string;
  notes?: string;
  allergies?: string;
  chronicConditions?: string;
  currentMedications?: string;
  medicalNotes?: string;
  status?: PatientStatus;
}
