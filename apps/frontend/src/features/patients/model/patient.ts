export const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const;
export const PATIENT_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;

export type PatientStatus = (typeof PATIENT_STATUSES)[number];
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export interface Patient {
  id: string;
  clinicId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: Date | null;
  gender: PatientGender | null;
  address: string | null;
  notes: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  currentMedications: string | null;
  medicalNotes: string | null;
  status: PatientStatus;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
