import type {
  CreatePatientCommand,
  UpdatePatientCommand,
} from './patient.commands';
import type { Patient, PatientGender, PatientStatus } from './patient';

export interface PatientQuickInfoFormModel {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: PatientGender | '';
  address: string;
  status: PatientStatus;
}

export interface PatientMedicalAlertsFormModel {
  allergies: string;
  chronicConditions: string;
  currentMedications: string;
  medicalNotes: string;
}

export const createEmptyPatientQuickInfoForm =
  (): PatientQuickInfoFormModel => ({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    status: 'ACTIVE',
  });

export const createEmptyPatientMedicalAlertsForm =
  (): PatientMedicalAlertsFormModel => ({
    allergies: '',
    chronicConditions: '',
    currentMedications: '',
    medicalNotes: '',
  });

const dateToInputValue = (value: Date | null): string =>
  value ? value.toISOString().slice(0, 10) : '';

export const mapPatientToQuickInfoForm = (
  patient: Patient,
): PatientQuickInfoFormModel => ({
  firstName: patient.firstName,
  lastName: patient.lastName,
  phone: patient.phone ?? '',
  email: patient.email ?? '',
  dateOfBirth: dateToInputValue(patient.dateOfBirth),
  gender: patient.gender ?? '',
  address: patient.address ?? '',
  status: patient.status,
});

export const mapPatientToMedicalAlertsForm = (
  patient: Patient,
): PatientMedicalAlertsFormModel => ({
  allergies: patient.allergies ?? '',
  chronicConditions: patient.chronicConditions ?? '',
  currentMedications: patient.currentMedications ?? '',
  medicalNotes: patient.medicalNotes ?? '',
});

const trimmedOrUndefined = (value: string): string | undefined => {
  const trimmed = value.trim();

  return trimmed === '' ? undefined : trimmed;
};

const trimmedOrNull = (value: string): string | null => {
  const trimmed = value.trim();

  return trimmed === '' ? null : trimmed;
};

const dateInputToDate = (value: string): Date | undefined =>
  value === '' ? undefined : new Date(`${value}T00:00:00.000Z`);

export const mapQuickInfoFormToCreateCommand = (
  clinicId: string,
  form: PatientQuickInfoFormModel,
): CreatePatientCommand => ({
  clinicId,
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  phone: trimmedOrUndefined(form.phone),
  email: trimmedOrUndefined(form.email),
  dateOfBirth: dateInputToDate(form.dateOfBirth),
  gender: form.gender || undefined,
  address: trimmedOrUndefined(form.address),
  status: form.status,
});

export const mapQuickInfoFormToUpdateCommand = (
  clinicId: string,
  patientId: string,
  form: PatientQuickInfoFormModel,
): UpdatePatientCommand => ({
  clinicId,
  patientId,
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  phone: trimmedOrNull(form.phone),
  email: trimmedOrNull(form.email),
  dateOfBirth:
    form.dateOfBirth === ''
      ? null
      : new Date(`${form.dateOfBirth}T00:00:00.000Z`),
  gender: form.gender || null,
  address: trimmedOrNull(form.address),
  status: form.status,
});

export const mapMedicalAlertsFormToUpdateCommand = (
  clinicId: string,
  patientId: string,
  form: PatientMedicalAlertsFormModel,
): UpdatePatientCommand => ({
  clinicId,
  patientId,
  allergies: trimmedOrNull(form.allergies),
  chronicConditions: trimmedOrNull(form.chronicConditions),
  currentMedications: trimmedOrNull(form.currentMedications),
  medicalNotes: trimmedOrNull(form.medicalNotes),
});
