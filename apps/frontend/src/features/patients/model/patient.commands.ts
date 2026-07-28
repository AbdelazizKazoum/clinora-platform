import type { PatientGender, PatientStatus } from './patient';

export interface CreatePatientCommand {
  clinicId: string;
  firstName: string;
  lastName: string;
  userId?: string;
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

export interface UpdatePatientCommand {
  clinicId: string;
  patientId: string;
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

export interface PatientRecordCommand {
  clinicId: string;
  patientId: string;
}

export type ArchivePatientCommand = PatientRecordCommand;
export type RestorePatientCommand = PatientRecordCommand;
export type DeletePatientCommand = PatientRecordCommand;
