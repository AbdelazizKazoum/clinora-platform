import type {
  CreatePatientRequestDto,
  PatientResponseDto,
  UpdatePatientRequestDto,
} from '../api/dto';
import type {
  CreatePatientCommand,
  UpdatePatientCommand,
} from './patient.commands';
import type { Patient } from './patient';

const emptyStringToNull = (value: string): string | null =>
  value === '' ? null : value;

const dateStringToDate = (value: string): Date | null =>
  value === '' ? null : new Date(value);

const optionalDateToDto = (
  value: Date | null | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return '';

  return value.toISOString();
};

const optionalNullableStringToCreateDto = (
  value: string | null | undefined,
): string | undefined => value ?? undefined;

const optionalNullableStringToUpdateDto = (
  value: string | null | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return '';

  return value;
};

export const mapPatientFromDto = (dto: PatientResponseDto): Patient => ({
  id: dto.id,
  clinicId: dto.clinicId,
  userId: emptyStringToNull(dto.userId),
  firstName: dto.firstName,
  lastName: dto.lastName,
  phone: emptyStringToNull(dto.phone),
  email: emptyStringToNull(dto.email),
  dateOfBirth: dateStringToDate(dto.dateOfBirth),
  gender: dto.gender === '' ? null : dto.gender,
  address: emptyStringToNull(dto.address),
  notes: emptyStringToNull(dto.notes),
  allergies: emptyStringToNull(dto.allergies),
  chronicConditions: emptyStringToNull(dto.chronicConditions),
  currentMedications: emptyStringToNull(dto.currentMedications),
  medicalNotes: emptyStringToNull(dto.medicalNotes),
  status: dto.status,
  deletedAt: dateStringToDate(dto.deletedAt),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const mapCreatePatientCommandToDto = (
  command: CreatePatientCommand,
): CreatePatientRequestDto => ({
  firstName: command.firstName,
  lastName: command.lastName,
  userId: command.userId,
  phone: optionalNullableStringToCreateDto(command.phone),
  email: optionalNullableStringToCreateDto(command.email),
  dateOfBirth:
    command.dateOfBirth === null || command.dateOfBirth === undefined
      ? undefined
      : command.dateOfBirth.toISOString(),
  gender: command.gender ?? undefined,
  address: optionalNullableStringToCreateDto(command.address),
  notes: optionalNullableStringToCreateDto(command.notes),
  allergies: optionalNullableStringToCreateDto(command.allergies),
  chronicConditions: optionalNullableStringToCreateDto(
    command.chronicConditions,
  ),
  currentMedications: optionalNullableStringToCreateDto(
    command.currentMedications,
  ),
  medicalNotes: optionalNullableStringToCreateDto(command.medicalNotes),
  status: command.status,
});

export const mapUpdatePatientCommandToDto = (
  command: UpdatePatientCommand,
): UpdatePatientRequestDto => ({
  firstName: command.firstName,
  lastName: command.lastName,
  phone: optionalNullableStringToUpdateDto(command.phone),
  email: optionalNullableStringToUpdateDto(command.email),
  dateOfBirth: optionalDateToDto(command.dateOfBirth),
  gender:
    command.gender === undefined
      ? undefined
      : command.gender === null
        ? ''
        : command.gender,
  address: optionalNullableStringToUpdateDto(command.address),
  notes: optionalNullableStringToUpdateDto(command.notes),
  allergies: optionalNullableStringToUpdateDto(command.allergies),
  chronicConditions: optionalNullableStringToUpdateDto(
    command.chronicConditions,
  ),
  currentMedications: optionalNullableStringToUpdateDto(
    command.currentMedications,
  ),
  medicalNotes: optionalNullableStringToUpdateDto(command.medicalNotes),
  status: command.status,
});
