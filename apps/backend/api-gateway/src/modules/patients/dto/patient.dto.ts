import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

import {
  PATIENT_GENDERS,
  PATIENT_STATUSES,
  type PatientGender,
  type PatientStatus,
} from '@clinora/contracts-patient';

import { BooleanQuery } from './query-transformers';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(PATIENT_GENDERS)
  gender?: PatientGender;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsIn(PATIENT_STATUSES)
  status?: PatientStatus;
}

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @ValidateIf(hasNonEmptyValue)
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @ValidateIf(hasNonEmptyValue)
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @ValidateIf(hasNonEmptyValue)
  @IsIn(PATIENT_GENDERS)
  gender?: PatientGender;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsIn(PATIENT_STATUSES)
  status?: PatientStatus;
}

export class ListPatientsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsIn(PATIENT_STATUSES)
  status?: PatientStatus;

  @IsOptional()
  @IsIn(PATIENT_GENDERS)
  gender?: PatientGender;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'createdAt', 'updatedAt'])
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class SearchPatientsQueryDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

function hasNonEmptyValue(_: unknown, value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}
